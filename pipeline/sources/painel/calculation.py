"""Treatment, quality, territorial origin, series and monthly alert rules in memory."""

import statistics
from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from enum import StrEnum
from typing import Any

from pipeline.status import classify_status, status_note
from pipeline.cascade import Origin, data_origins
from pipeline.trend import quasi_poisson_trend, trend_window

from .models import (
    CANCER_TYPES,
    CaseCounts,
    CleanRow,
    FirstTreatment,
    MEASURED_CASES,
    MonthKey,
    WITHOUT_STATUS,
)


def within_60_days_layer(
    counts: Mapping[tuple[int, str], CaseCounts],
    *,
    immediate_region_of: Mapping[str, str],
    provisional: set[int],
    cancer_type: str = "all",
) -> dict[str, Any]:
    """The map layer of one cancer type: each municipality's trend and latest shares.

    The trend and the value of the latest consolidated year are measured on the
    chemo/radio cases only, a series the Painel's 2018 and 2024 breaks leave
    untouched; the % without treatment information is over all the cases of that
    year, as TabNet shows it (spec, sections 6.3, 7 and 9).

    A municipality below the minimum of chemo/radio cases shows its immediate
    region's trend and shares, or none at all (spec, section 8).

    Every municipality also carries its UF's quality band, from the % of all the
    cases without treatment information over the last 5 consolidated years
    (spec, section 6.3); `quality` gives each UF's band and share.

    `counts` is keyed by (diagnosis year, municipality). `immediate_region_of` maps every
    municipality of the mesh to its immediate region: all of them are in the
    layer, and codes outside it (unknown residence) are ignored.
    """
    years = sorted({year for year, _ in counts})
    window = trend_window(years, provisional)
    if window is None:
        raise ValueError("no consolidated diagnosis year to publish")
    first, latest = window
    by_municipality, by_immediate_region, _ = _group_series(counts, immediate_region_of)

    origins = data_origins(
        {
            code: sum(entry.chemo_radio for year, entry in series.items() if first <= year <= latest)
            for code, series in by_municipality.items()
        },
        immediate_region_of,
        years=latest - first + 1,
    )
    consolidated = [year for year in years if year not in provisional]
    quality_window = (consolidated[-QUALITY_YEARS:][0], latest)
    quality = uf_quality(counts, {code[:2] for code in immediate_region_of}, quality_window)
    regional_shown: dict[str, dict[str, Any]] = {}
    layer = {}
    for code, origin in origins.items():
        if origin is Origin.MUNICIPALITY:
            shown = _trend_and_shares(by_municipality[code], years, latest, provisional)
        elif origin is Origin.IMMEDIATE_REGION:
            region = immediate_region_of[code]
            if region not in regional_shown:
                regional_shown[region] = _trend_and_shares(by_immediate_region[region], years, latest, provisional)
            shown = regional_shown[region]
        else:
            shown = NO_DATA
        layer[code] = {
            "origin": origin.value,
            **shown,
            "quality_band": quality[code[:2]]["band"],
            "status": shown["status"] if cancer_type not in WITHOUT_STATUS else None,
            "status_note": shown["status_note"] if cancer_type not in WITHOUT_STATUS else None,
        }
    period = {
        "first_year": years[0],
        "last_year": years[-1],
        "provisional": sorted(provisional & set(years)),
        "latest": latest,
        "trend": list(window),
        "trend_cases": MEASURED_CASES,
        "value_cases": MEASURED_CASES,
        "quality_years": list(quality_window),
    }
    return {
        "period": period,
        "quality": quality,
        "municipalities": layer,
        "reference": {"value": 100, "label": "o que a lei garante"} if cancer_type not in WITHOUT_STATUS else None,
    }


type PlaceSeries = dict[str, dict[int, CaseCounts]]


def _group_series(
    counts: Mapping[tuple[int, str], CaseCounts], immediate_region_of: Mapping[str, str]
) -> tuple[PlaceSeries, PlaceSeries, PlaceSeries]:
    """Group known residences by municipality, immediate region and UF for both layers."""
    by_municipality: dict[str, dict[int, CaseCounts]] = {code: {} for code in immediate_region_of}
    by_immediate_region: dict[str, dict[int, CaseCounts]] = {region: {} for region in immediate_region_of.values()}
    for (year, code), entry in counts.items():
        if code in by_municipality:
            by_municipality[code][year] = entry
            regional = by_immediate_region[immediate_region_of[code]]
            regional[year] = regional.get(year, CaseCounts()) + entry

    by_uf: PlaceSeries = {code[:2]: {} for code in immediate_region_of}
    for code, series in by_municipality.items():
        for year, entry in series.items():
            uf_series = by_uf[code[:2]]
            uf_series[year] = uf_series.get(year, CaseCounts()) + entry
    return by_municipality, by_immediate_region, by_uf


def within_60_days_profiles(
    counts: Mapping[tuple[int, str], CaseCounts],
    layer: Mapping[str, Any],
    immediate_region_of: Mapping[str, str],
) -> dict[str, Any]:
    """Displayed series with the map's origin; UF trends are context only.

    Share regional series and suppress insufficient municipalities' series.
    """
    years = sorted({year for year, _ in counts})
    provisional = set(layer["period"]["provisional"])
    by_municipality, by_region, by_uf = _group_series(counts, immediate_region_of)
    grouped = {
        **{f"municipality:{code}": series for code, series in by_municipality.items()},
        **{f"immediate_region:{code}": series for code, series in by_region.items()},
    }
    municipalities = {}
    displayed = {}
    for code, entry in layer["municipalities"].items():
        series_id = None
        if entry["origin"] == "municipality":
            series_id = f"municipality:{code}"
        elif entry["origin"] == "immediate_region":
            series_id = f"immediate_region:{immediate_region_of[code]}"
        municipalities[code] = {**entry, "series_id": series_id}
        if series_id is not None and series_id not in displayed:
            series = grouped.get(series_id, {})
            points = []
            for year in years:
                cases = series.get(year, CaseCounts())
                points.append({
                    "year": year, "provisional": year in provisional,
                    "value": _percent(cases.chemo_radio_within_60_days, cases.chemo_radio),
                    "without_treatment_info": _percent(cases.without_treatment_info, cases.cases),
                })
            displayed[series_id] = points
    return {
        "municipalities": municipalities,
        "series": displayed,
        "uf_trends": {uf: _trend_and_shares(series, years, layer["period"]["latest"], provisional)["trend"] for uf, series in by_uf.items()},
    }


QUALITY_YEARS = 5
"""The quality band looks at the last 5 consolidated years (spec, section 6.3)."""


class QualityBand(StrEnum):
    """Quality of the treatment records of a UF × cancer type (spec, section 6.3)."""

    A = "A"
    B = "B"
    C = "C"


def quality_band(without_treatment_info: int, cases: int) -> QualityBand | None:
    """A, B or C from the share of cases without treatment information (spec, section 6.3):
    A up to 15%, B above 15% and below 35%, C from 35%. Compared exactly, not rounded."""
    if not cases:
        return None
    if 100 * without_treatment_info <= 15 * cases:
        return QualityBand.A
    if 100 * without_treatment_info < 35 * cases:
        return QualityBand.B
    return QualityBand.C


def uf_quality(
    counts: Mapping[tuple[int, str], CaseCounts], ufs: Iterable[str], window: tuple[int, int]
) -> dict[str, dict[str, Any]]:
    """Each UF's quality band and % without treatment information, pooling all the cases
    diagnosed in the window, by UF of residence. Cases with an unknown municipality of
    residence still count for their UF, as in TabNet."""
    first, last = window
    pooled = {uf: CaseCounts() for uf in sorted(ufs)}
    for (year, code), entry in counts.items():
        uf = code[:2]
        if uf in pooled and first <= year <= last:
            pooled[uf] += entry
    return {
        uf: {
            "band": quality_band(total.without_treatment_info, total.cases),
            "without_treatment_info": _percent(total.without_treatment_info, total.cases),
        }
        for uf, total in pooled.items()
    }


NO_DATA = {"status": None, "status_note": None, "trend": None, "value": None, "without_treatment_info": None}
"""An insufficient municipality exports neither a class nor shares that would reveal its few cases."""


def _trend_and_shares(series: Mapping[int, CaseCounts], years: Sequence[int], latest: int, provisional: set[int]) -> dict[str, Any]:
    """The trend class and latest shares of a municipality's or a region's series."""
    trend = quasi_poisson_trend(
        years,
        [series[y].chemo_radio_within_60_days if y in series else 0 for y in years],
        [series[y].chemo_radio if y in series else 0 for y in years],
        provisional=provisional,
        higher_is_better=True,
    )
    last = series.get(latest, CaseCounts())
    raw_value = 100 * last.chemo_radio_within_60_days / last.chemo_radio if last.chemo_radio else None
    return {
        "status": classify_status(raw_value, reference=100),
        "status_note": status_note(raw_value, maximum=100),
        "trend": trend.trend_class.value if trend else None,
        "value": _percent(last.chemo_radio_within_60_days, last.chemo_radio),
        "without_treatment_info": _percent(last.without_treatment_info, last.cases),
    }


def _percent(count: int, cases: int) -> float | None:
    """A count as a share of the year's cases, in percent with one decimal."""
    return round(100 * count / cases, 1) if cases else None

DROP_SHARE = 0.75
"""A month below this share of the median of the 12 months before it has dropped to a new level."""

WATCH_MONTHS = 12


def monthly_drops(months: Mapping[MonthKey, int], *, provisional: set[int]) -> list[str]:
    """Alerts for the months whose cases of a first treatment fell far below the median of the
    12 months before, as the surgeries did from April 2024 (spec, section 14). Months of the
    provisional years are still filling in and are not watched."""
    if not months:
        return []
    observed = sorted({month for month, _ in months})
    first_year, first_month = map(int, observed[0].split("-"))
    last_year, last_month = map(int, observed[-1].split("-"))
    calendar = [
        f"{index // 12:04d}-{index % 12 + 1:02d}"
        for index in range(first_year * 12 + first_month - 1, last_year * 12 + last_month)
    ]
    alerts = []
    for treatment in FirstTreatment:
        series = [months.get((month, treatment), 0) for month in calendar]
        for i in range(WATCH_MONTHS, len(calendar)):
            month, cases = calendar[i], series[i]
            if int(month[:4]) in provisional:
                continue
            reference = statistics.median(series[i - WATCH_MONTHS : i])
            if cases < DROP_SHARE * reference:
                alerts.append(
                    f"{treatment.value}, {month}: {cases} cases, {cases / reference:.0%} of the median "
                    f"of the {WATCH_MONTHS} months before ({reference:.0f})"
                )
    return alerts


@dataclass
class PainelResult:
    """Calculated map layers, displayed profile series and informative monthly alerts."""

    layers: dict[str, dict[str, Any]]
    profiles: dict[str, dict[str, Any]]
    monthly_alerts: list[str]


def calculate(
    rows: Sequence[CleanRow],
    monthly_counts: Mapping[MonthKey, int],
    immediate_region_of: Mapping[str, str],
) -> PainelResult:
    """Calculate from loaded inputs without reading or writing files.

    Profiles select their series from the origin already decided by each map layer.
    """
    provisional = {row.year for row in rows if row.provisional}
    alerts = monthly_drops(monthly_counts, provisional=provisional)
    layers = {}
    profiles = {}
    for cancer_type in CANCER_TYPES:
        counts = {
            (row.year, row.municipality): row.counts
            for row in rows if row.cancer_type == cancer_type
        }
        layer = within_60_days_layer(
            counts, immediate_region_of=immediate_region_of,
            provisional=provisional, cancer_type=cancer_type,
        )
        layers[cancer_type] = layer
        profiles[cancer_type] = within_60_days_profiles(counts, layer, immediate_region_of)
    return PainelResult(layers, profiles, alerts)
