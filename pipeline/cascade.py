"""Small municipalities: whose data each municipality shows (spec, section 8)."""

from collections.abc import Mapping
from enum import StrEnum

MINIMUM_PER_YEAR = 20
"""A unit has enough data with a mean of at least 20 a year in the window (spec, section 8)."""


class Origin(StrEnum):
    MUNICIPALITY = "municipality"
    REGION = "region"
    INSUFFICIENT = "insufficient"


def cascade(volumes: Mapping[str, float], region_of: Mapping[str, str], *, years: int) -> dict[str, Origin]:
    """Origin of each municipality's data for one indicator × cancer type."""
    minimum = MINIMUM_PER_YEAR * years
    regional: dict[str, float] = {}
    for code, region in region_of.items():
        regional[region] = regional.get(region, 0) + volumes.get(code, 0)
    return {
        code: Origin.MUNICIPALITY
        if volumes.get(code, 0) >= minimum
        else Origin.REGION
        if regional[region] >= minimum
        else Origin.INSUFFICIENT
        for code, region in region_of.items()
    }
