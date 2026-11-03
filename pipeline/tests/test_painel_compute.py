from pipeline.sources.painel import CaseCounts, within_60_days_layer

YEARS = range(2014, 2027)
PROVISIONAL = {2025, 2026}
RECIFE = {"261160": "260001"}


def rising(municipality, cases=1000, start=0.30, step=0.03):
    """A municipality whose share treated within 60 days grows 3 points a year,
    in all its cases and in the half treated with chemotherapy or radiotherapy."""
    return {
        (year, municipality): CaseCounts(
            cases=cases,
            within_60_days=round(cases * (start + step * i)),
            without_treatment_info=cases // 10,
            chemo_radio=cases // 2,
            chemo_radio_within_60_days=round(cases // 2 * (start + step * i)),
        )
        for i, year in enumerate(YEARS)
    }


def test_every_municipality_of_the_mesh_is_in_the_layer():
    layer = within_60_days_layer(rising("261160"), region_of={"261160": "260001", "510183": "510001"}, provisional=PROVISIONAL)

    assert layer["municipalities"].keys() == {"261160", "510183"}
    assert layer["municipalities"]["510183"] == {
        "origin": "insufficient",
        "trend": None,
        "value": None,
        "without_treatment_info": None,
    }


def test_a_municipality_carries_its_class_and_latest_consolidated_shares():
    counts = rising("261160")
    # Provisional 2025–2026 would show a collapse; they must not be the latest value.
    counts[(2025, "261160")] = CaseCounts(cases=1000, within_60_days=100, without_treatment_info=800)

    layer = within_60_days_layer(counts, region_of=RECIFE, provisional=PROVISIONAL)

    # 2024 is the 11th year: 30% + 10 × 3 points = 60%; 100 of 1000 without information.
    assert layer["municipalities"]["261160"] == {
        "origin": "municipality",
        "trend": "improving",
        "value": 60.0,
        "without_treatment_info": 10.0,
    }


def test_the_layer_states_its_period():
    layer = within_60_days_layer(rising("261160"), region_of=RECIFE, provisional=PROVISIONAL)

    assert layer["period"] == {
        "first_year": 2014,
        "last_year": 2026,
        "provisional": [2025, 2026],
        "latest": 2024,
        "trend": [2015, 2024],
        "trend_cases": "chemo_radio",
    }


def test_shares_are_rounded_to_one_decimal_and_absent_without_cases_that_year():
    # The window is 2023–2024; 40 chemo/radio cases in it reach the minimum of 20 a year.
    counts = {
        (2023, "261160"): CaseCounts(cases=3, within_60_days=1, without_treatment_info=2, chemo_radio=40),
        (2025, "261160"): CaseCounts(cases=5, within_60_days=5, without_treatment_info=0),
        (2024, "355030"): CaseCounts(cases=3, within_60_days=1, without_treatment_info=2, chemo_radio=40),
    }

    layer = within_60_days_layer(counts, region_of={"261160": "260001", "355030": "350001"}, provisional={2025})

    assert layer["municipalities"]["355030"]["value"] == 33.3
    assert layer["municipalities"]["355030"]["without_treatment_info"] == 66.7
    assert layer["municipalities"]["261160"]["value"] is None


def test_a_registry_step_outside_chemo_radio_cases_does_not_change_the_class():
    # From 2018 the Painel adds biopsy diagnoses: 1000 more cases a year, surgeries
    # and cases without treatment information, which halve the share of all cases
    # on time. The 400 chemo/radio cases, 158 or 162 of them on time, do not change.
    counts = {}
    for i, year in enumerate(YEARS):
        added = 1000 if year >= 2018 else 0
        counts[(year, "261160")] = CaseCounts(
            cases=1000 + added,
            within_60_days=500,
            without_treatment_info=40 + added // 2,
            chemo_radio=400,
            chemo_radio_within_60_days=158 + 4 * (i % 2),
        )

    layer = within_60_days_layer(counts, region_of=RECIFE, provisional=PROVISIONAL)

    assert layer["municipalities"]["261160"] == {
        "origin": "municipality",
        "trend": "stable",
        # The value and the % without information stay over all the 2024 cases.
        "value": 25.0,
        "without_treatment_info": 27.0,
    }


def small(municipality, cases=8):
    """A municipality far below the minimum: 8 chemo/radio cases a year, half on time."""
    return {
        (year, municipality): CaseCounts(
            cases=2 * cases,
            within_60_days=cases,
            without_treatment_info=cases // 4,
            chemo_radio=cases,
            chemo_radio_within_60_days=cases // 2,
        )
        for year in YEARS
    }


def test_a_small_municipality_shows_its_immediate_region():
    # Recife reaches the minimum alone; Abreu e Lima and Igarassu, 8 cases a year each,
    # take the data of the Recife region, which sums the three of them.
    counts = rising("261160") | small("260005") | small("260680")
    region_of = {"261160": "260001", "260005": "260001", "260680": "260001"}

    layer = within_60_days_layer(counts, region_of=region_of, provisional=PROVISIONAL)

    assert layer["municipalities"]["261160"]["origin"] == "municipality"
    # 2024: (600 + 8 + 8) of (1000 + 16 + 16) cases on time; (100 + 2 + 2) without information.
    assert layer["municipalities"]["260005"] == {
        "origin": "region",
        "trend": "improving",
        "value": 59.7,
        "without_treatment_info": 10.1,
    }
    assert layer["municipalities"]["260680"] == layer["municipalities"]["260005"]


def test_a_municipality_without_enough_data_nor_region_exports_no_value():
    counts = small("260005") | small("260680")
    region_of = {"260005": "260001", "260680": "260001"}

    layer = within_60_days_layer(counts, region_of=region_of, provisional=PROVISIONAL)

    # 16 a year in the region: not enough. Neither the class nor shares that would
    # reveal a handful of cases are exported.
    assert layer["municipalities"]["260005"] == {
        "origin": "insufficient",
        "trend": None,
        "value": None,
        "without_treatment_info": None,
    }
