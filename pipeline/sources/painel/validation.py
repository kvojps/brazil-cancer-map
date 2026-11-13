"""Blocking checks; monthly alerts remain informative in the source coordinator."""

from collections.abc import KeysView, Mapping, Sequence

from .models import CANCER_TYPES, TABNET_CANCER_TYPE, TABNET_TABLES, CaseCounts, CleanRow, UfShare
from typing import Any

TABNET_TOLERANCE = 0.5
"""Largest gap, in percentage points, between our shares and TabNet's for a UF.
TabNet and the FTP files are refreshed on different days of the month."""

TABNET_CASES_TOLERANCE = 0.01
"""Largest relative gap between our number of cases and TabNet's for a UF, for the same reason."""


def compare_with_tabnet(
    ours: Mapping[str, UfShare], official: Mapping[str, UfShare], *, year: int
) -> list[str]:
    """Problems found comparing, by UF and for one year, the number of cases, the % within
    60 days and the % without treatment information with TabNet's."""
    problems = []
    for uf, expected in sorted(official.items()):
        if expected.cases == 0:
            continue
        got = ours.get(uf)
        if got is None or got.cases == 0:
            problems.append(f"{year}, UF {uf}: TabNet has {expected.cases} cases, we have none")
            continue
        if abs(got.cases - expected.cases) > TABNET_CASES_TOLERANCE * expected.cases:
            problems.append(f"{year}, UF {uf}: {got.cases} cases, TabNet {expected.cases}")
        for label, mine, theirs in (
            ("within 60 days", got.within_60_days, expected.within_60_days),
            ("without treatment information", got.without_treatment_info, expected.without_treatment_info),
        ):
            mine_share = 100 * mine / got.cases
            their_share = 100 * theirs / expected.cases
            if abs(mine_share - their_share) > TABNET_TOLERANCE:
                problems.append(f"{year}, UF {uf}: {mine_share:.1f}% {label}, TabNet {their_share:.1f}%")
    return problems


class PainelValidationError(Exception):
    pass


def check(
    rows: Sequence[CleanRow], layers: Mapping[str, Any],
    tables: Mapping[tuple[str, int], Mapping[str, UfShare]], expected: KeysView[str],
) -> None:
    """Apply blocking official comparisons and layer checks to loaded data."""
    by_year: dict[int, dict[str, CaseCounts]] = {}
    for row in rows:
        if row.cancer_type == TABNET_CANCER_TYPE:
            by_uf = by_year.setdefault(row.year, {})
            uf = row.municipality[:2]
            by_uf[uf] = by_uf.get(uf, CaseCounts()) + row.counts

    problems = []
    for table in TABNET_TABLES:
        for year, by_uf in sorted(by_year.items()):
            official = tables.get((table.directory, year))
            if official is None:
                problems.append(f"{table.label}, {year}: no TabNet table to compare with")
                continue
            if table.modalities:
                ours = {uf: UfShare(c.chemo_radio_within_60_days, c.chemo_radio) for uf, c in by_uf.items()}
            else:
                ours = {
                    uf: UfShare(c.within_60_days, c.cases, c.without_treatment_info) for uf, c in by_uf.items()
                }
            if not official:
                problems.append(f"{table.label}, {year}: empty TabNet table")
            problems += [
                f"{table.label}, {problem}" for problem in compare_with_tabnet(ours, official, year=year)
            ]

    for cancer_type in CANCER_TYPES:
        layer = layers[cancer_type]
        if layer["municipalities"].keys() != expected:
            problems.append(f"layer '{cancer_type}' does not cover the mesh's municipalities")
        implausible = sorted(
            code
            for code, entry in layer["municipalities"].items()
            for share in (entry["value"], entry["without_treatment_info"])
            if share is not None and not 0 <= share <= 100
        )
        if implausible:
            problems.append(f"layer '{cancer_type}' has shares outside 0–100%: {implausible[:10]}")
        unbanded = sorted(uf for uf, quality in layer["quality"].items() if quality["band"] is None)
        if unbanded:
            problems.append(f"layer '{cancer_type}' has UFs without a quality band: {', '.join(unbanded)}")
    if problems:
        raise PainelValidationError("; ".join(problems))
