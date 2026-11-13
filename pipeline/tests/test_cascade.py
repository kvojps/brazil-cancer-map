from pipeline.calculation.cascade import Origin, data_origins

IMMEDIATE_REGION_OF = {"261160": "260001", "260005": "260001", "261390": "260001", "355030": "350001"}
"""Recife and two small neighbours in one immediate region; São Paulo in another."""


def test_a_municipality_with_20_a_year_uses_its_own_data():
    # 200 cases over a 10-year window: exactly the minimum of 20 a year.
    origins = data_origins({"261160": 200, "355030": 5000}, IMMEDIATE_REGION_OF, years=10)

    assert origins["261160"] == Origin.MUNICIPALITY
    assert origins["355030"] == Origin.MUNICIPALITY


def test_below_the_minimum_a_municipality_uses_its_immediate_region():
    # 19.9 a year is not enough alone; with its neighbours the region has 30 a year.
    origins = data_origins({"261160": 199, "260005": 60, "261390": 41}, IMMEDIATE_REGION_OF, years=10)

    assert origins["261160"] == Origin.IMMEDIATE_REGION
    assert origins["260005"] == Origin.IMMEDIATE_REGION


def test_without_enough_data_in_the_region_a_municipality_has_insufficient_data():
    # The region has 19.9 a year. Other regions never fill the gap: the cascade
    # does not go up to the UF or further.
    origins = data_origins({"261160": 150, "260005": 49, "355030": 5000}, IMMEDIATE_REGION_OF, years=10)

    assert origins["261160"] == Origin.INSUFFICIENT
    assert origins["261390"] == Origin.INSUFFICIENT
    assert origins["355030"] == Origin.MUNICIPALITY


def test_the_minimum_scales_with_the_window():
    # 5 years: 100 cases are 20 a year.
    origins = data_origins({"261160": 100}, IMMEDIATE_REGION_OF, years=5)

    assert origins["261160"] == Origin.MUNICIPALITY
