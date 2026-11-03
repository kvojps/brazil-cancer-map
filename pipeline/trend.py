"""The Tendência of an indicator: one annual percent change with a 95% CI (spec, section 7)."""

import math
from collections.abc import Collection, Iterable, Sequence
from dataclasses import dataclass
from enum import StrEnum

import numpy as np
import statsmodels.api as sm
from scipy import stats

MAX_YEARS = 10
"""The trend uses the last up to 10 consolidated years (spec, section 7)."""

STABLE_BAND = 1.0
"""Stable when the whole CI fits within ±1% a year, relative (spec, section 7)."""


class TrendClass(StrEnum):
    IMPROVING = "improving"
    WORSENING = "worsening"
    STABLE = "stable"
    NO_CLEAR_DIRECTION = "no_clear_direction"


@dataclass(frozen=True)
class Trend:
    annual_percent_change: float
    """Relative change per year, in percent of the indicator's own value."""
    ci_low: float
    ci_high: float
    """95% confidence interval of the annual percent change."""
    trend_class: TrendClass
    first_year: int
    last_year: int
    """The window the trend was fitted on."""


def classify(ci_low: float, ci_high: float, *, higher_is_better: bool) -> TrendClass:
    """Class of a trend from the 95% CI of its annual percent change.

    A CI inside ±1% is stable even when it excludes zero: the indicator is
    known to have barely changed, which is what "estável" tells the public.
    """
    if -STABLE_BAND <= ci_low and ci_high <= STABLE_BAND:
        return TrendClass.STABLE
    if ci_low > 0:
        return TrendClass.IMPROVING if higher_is_better else TrendClass.WORSENING
    if ci_high < 0:
        return TrendClass.WORSENING if higher_is_better else TrendClass.IMPROVING
    return TrendClass.NO_CLEAR_DIRECTION


def trend_window(years: Iterable[int], provisional: Collection[int]) -> tuple[int, int] | None:
    """First and last calendar year of the trend: the last `MAX_YEARS` consolidated years."""
    consolidated = [year for year in years if year not in provisional]
    if not consolidated:
        return None
    end = max(consolidated)
    return max(min(consolidated), end - MAX_YEARS + 1), end


def quasi_poisson_trend(
    years: Sequence[int],
    events: Sequence[float],
    exposure: Sequence[float],
    *,
    higher_is_better: bool,
    provisional: Collection[int] = (),
) -> Trend | None:
    """Fit `log(events) = a + b·year + log(exposure)` with quasi-Poisson errors.

    `years` is the whole calendar series. Provisional years are left out, and
    the window is the last `MAX_YEARS` consolidated calendar years. Inside it,
    years without exposure carry no information and drop out. Returns `None`
    when the series cannot estimate a slope: fewer than 3 years with exposure,
    or every event in the first or the last of them (no finite estimate).

    The dispersion is Pearson's χ²/(n−2), so the CI uses Student's t with n−2
    degrees of freedom, as R does for quasi families.
    """
    window = trend_window(years, provisional)
    if window is None:
        return None
    points = sorted(
        (year, e, n)
        for year, e, n in zip(years, events, exposure, strict=True)
        if window[0] <= year <= window[1] and year not in provisional and n > 0
    )
    if len(points) < 3:
        return None
    with_events = [year for year, e, _ in points if e > 0]
    if not with_events or set(with_events) <= {points[0][0]} or set(with_events) <= {points[-1][0]}:
        return None

    t = np.array([p[0] for p in points], dtype=float)
    y = np.array([p[1] for p in points], dtype=float)
    n = np.array([p[2] for p in points], dtype=float)
    fit = sm.GLM(y, sm.add_constant(t - t[0]), family=sm.families.Poisson(), offset=np.log(n)).fit()
    # Quasi-Poisson: Pearson's dispersion scales the Poisson standard error. It is
    # computed here rather than with `fit(scale="X2")`, which divides 0 by 0 on a
    # series with no scatter at all.
    dispersion = float(np.sum(fit.resid_pearson**2)) / (len(points) - 2)
    slope, se = float(fit.params[1]), float(fit.bse[1]) * math.sqrt(dispersion)
    margin = float(stats.t.ppf(0.975, df=len(points) - 2)) * se
    low, high = (100 * math.expm1(slope - margin), 100 * math.expm1(slope + margin))
    return Trend(
        annual_percent_change=100 * math.expm1(slope),
        ci_low=low,
        ci_high=high,
        trend_class=classify(low, high, higher_is_better=higher_is_better),
        first_year=points[0][0],
        last_year=points[-1][0],
    )
