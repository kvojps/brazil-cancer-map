"""Small municipalities: whose data each municipality shows (spec, section 8)."""

from collections.abc import Mapping
from enum import StrEnum

MINIMUM_PER_YEAR = 20
"""A unit has enough data with a mean of at least 20 a year in the window (spec, section 8)."""


class Origin(StrEnum):
    """Whose data a municipality shows: its own, its immediate region's, or none."""

    MUNICIPALITY = "municipality"
    IMMEDIATE_REGION = "immediate_region"
    INSUFFICIENT = "insufficient"


def data_origins(
    volumes: Mapping[str, float], immediate_region_of: Mapping[str, str], *, years: int
) -> dict[str, Origin]:
    """Origin of each municipality's data for one indicator × cancer type.

    `volumes` is what counts for the minimum, summed over the `years` of the
    window, by municipality: the numerator for rates, the trend's denominator
    for proportions. A municipality below the minimum takes its immediate
    region's data if the region, summing all its municipalities, reaches it;
    otherwise its data is insufficient. The cascade never goes up to the UF.
    Every municipality of `immediate_region_of` gets an origin.
    """
    minimum = MINIMUM_PER_YEAR * years
    regional: dict[str, float] = {}
    for code, region in immediate_region_of.items():
        regional[region] = regional.get(region, 0) + volumes.get(code, 0)

    def origin(code: str) -> Origin:
        if volumes.get(code, 0) >= minimum:
            return Origin.MUNICIPALITY
        if regional[immediate_region_of[code]] >= minimum:
            return Origin.IMMEDIATE_REGION
        return Origin.INSUFFICIENT

    return {code: origin(code) for code in immediate_region_of}
