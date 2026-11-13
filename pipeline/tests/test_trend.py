from typing import Any

import pytest

from pipeline.calculation.trend import Trend, TrendClass, quasi_poisson_trend

YEARS = list(range(2015, 2025))


def fitted(*args: Any, **kwargs: Any) -> Trend:
    trend = quasi_poisson_trend(*args, **kwargs)
    assert trend is not None
    return trend


def test_annual_change_is_relative_to_the_indicator_own_value():
    # 40% growing exactly 5% a year: the change is +5% a year, not +2 percentage points.
    cases = [1000] * len(YEARS)
    within = [1000 * 0.40 * 1.05**i for i in range(len(YEARS))]

    trend = fitted(YEARS, within, cases, higher_is_better=True)

    assert trend.annual_percent_change == pytest.approx(5.0)


NOISE = [1.02, 0.97, 1.01, 0.99, 1.03, 0.98, 1.0, 1.02, 0.97, 1.01]
"""A fixed wobble around the curve, so each series has some scatter."""


def series(cases_per_year, share, change_per_year, noise=NOISE):
    """Cases and events (treated within 60 days) for a share growing `change_per_year` a year."""
    cases = [cases_per_year] * len(YEARS)
    events = [cases_per_year * share * (1 + change_per_year) ** i * noise[i] for i in range(len(YEARS))]
    return cases, events


def test_a_clear_rise_is_improving_when_higher_is_better():
    cases, within = series(1000, 0.40, 0.04)

    trend = fitted(YEARS, within, cases, higher_is_better=True)

    assert trend.trend_class is TrendClass.IMPROVING
    assert trend.ci_low > 0


def test_a_clear_fall_is_worsening_when_higher_is_better():
    cases, within = series(1000, 0.60, -0.04)

    trend = fitted(YEARS, within, cases, higher_is_better=True)

    assert trend.trend_class is TrendClass.WORSENING


def test_a_clear_fall_is_improving_when_lower_is_better():
    # Mortality: falling is improving.
    population, deaths = series(100_000, 0.001, -0.04)

    trend = fitted(YEARS, deaths, population, higher_is_better=False)

    assert trend.trend_class is TrendClass.IMPROVING


def test_a_large_flat_series_is_stable():
    # A capital's worth of cases, wobbling around 50% with no direction.
    cases, within = series(20_000, 0.50, 0.0, noise=[1 + (n - 1) / 10 for n in NOISE])

    trend = fitted(YEARS, within, cases, higher_is_better=True)

    assert trend.trend_class is TrendClass.STABLE
    assert -1 <= trend.ci_low < 0 < trend.ci_high <= 1


def test_a_small_noisy_series_has_no_clear_direction():
    cases = [20] * len(YEARS)
    within = [9, 12, 8, 11, 10, 13, 7, 10, 12, 9]

    trend = fitted(YEARS, within, cases, higher_is_better=True)

    assert trend.trend_class is TrendClass.NO_CLEAR_DIRECTION
    assert trend.ci_low < -1 and trend.ci_high > 1


def test_a_tiny_but_certain_change_is_stable_not_improving():
    # The CI excludes zero, yet fits inside ±1%: it barely changed.
    cases, within = series(1_000_000, 0.50, 0.005, noise=[1 + (n - 1) / 20 for n in NOISE])

    trend = fitted(YEARS, within, cases, higher_is_better=True)

    assert 0 < trend.ci_low and trend.ci_high <= 1
    assert trend.trend_class is TrendClass.STABLE


def test_only_the_last_ten_consolidated_years_enter():
    # 2013–2014 sit before the window; 2025–2026 are provisional and collapse
    # (treatment not yet recorded). Neither may tilt the flat 2015–2024 series.
    cases, flat = series(20_000, 0.50, 0.0, noise=[1 + (n - 1) / 10 for n in NOISE])
    years = [2013, 2014, *YEARS, 2025, 2026]
    within = [2_000, 4_000, *flat, 4_000, 2_000]

    trend = fitted(
        years, within, [20_000] * len(years), provisional={2025, 2026}, higher_is_better=True
    )

    assert (trend.first_year, trend.last_year) == (2015, 2024)
    assert trend.trend_class is TrendClass.STABLE


def test_years_without_cases_drop_out_but_the_window_stays_put():
    # A municipality with no cases in 2015–2016: the window is still 2015–2024,
    # never stretched back to 2013–2014 to fill ten points.
    cases, flat = series(20_000, 0.50, 0.0, noise=[1 + (n - 1) / 10 for n in NOISE])
    years = [2013, 2014, *YEARS]
    within = [2_000, 4_000, 0, 0, *flat[2:]]
    exposure = [20_000, 20_000, 0, 0, *cases[2:]]

    trend = fitted(years, within, exposure, higher_is_better=True)

    assert trend.trend_class is TrendClass.STABLE
    assert (trend.first_year, trend.last_year) == (2017, 2024)


@pytest.mark.parametrize(
    ("within", "cases"),
    [
        pytest.param([0] * 10, [3] * 10, id="no events at all"),
        pytest.param([0] * 8 + [1, 1], [0] * 8 + [2, 2], id="only two years with cases"),
        pytest.param([0] * 9 + [2], [2] * 10, id="events only in the last year"),
        pytest.param([2] + [0] * 9, [2] * 10, id="events only in the first year"),
    ],
)
def test_no_trend_when_the_series_cannot_estimate_one(within, cases):
    assert quasi_poisson_trend(YEARS, within, cases, higher_is_better=True) is None


def test_a_perfectly_flat_series_is_stable():
    # A small municipality at 100% every year: no scatter at all.
    trend = fitted(YEARS, [3] * 10, [3] * 10, higher_is_better=True)

    assert trend.trend_class is TrendClass.STABLE
    assert trend.annual_percent_change == pytest.approx(0.0, abs=1e-9)
