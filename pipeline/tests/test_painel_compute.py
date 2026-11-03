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
    layer = within_60_days_layer(rising("261160"), immediate_region_of={"261160": "260001", "510183": "510001"}, provisional=PROVISIONAL)

    assert layer["municipalities"].keys() == {"261160", "510183"}
    assert layer["municipalities"]["510183"] == {
        "origin": "insufficient",
        "trend": None,
        "value": None,
        "without_treatment_info": None,
        # No case at all in Mato Grosso: no band to give.
        "quality_band": None,
    }


def test_a_municipality_carries_its_class_and_latest_consolidated_shares():
    counts = rising("261160")
    # Provisional 2025–2026 would show a collapse; they must not be the latest value.
    counts[(2025, "261160")] = CaseCounts(cases=1000, within_60_days=100, without_treatment_info=800)

    layer = within_60_days_layer(counts, immediate_region_of=RECIFE, provisional=PROVISIONAL)

    # 2024 is the 11th year: 30% + 10 × 3 points = 60%; 100 of 1000 without information.
    assert layer["municipalities"]["261160"] == {
        "origin": "municipality",
        "trend": "improving",
        "value": 60.0,
        "without_treatment_info": 10.0,
        # 10% without information in 2020–2024; the provisional 80% of 2025 stays out.
        "quality_band": "A",
    }


def test_the_layer_states_its_period():
    layer = within_60_days_layer(rising("261160"), immediate_region_of=RECIFE, provisional=PROVISIONAL)

    assert layer["period"] == {
        "first_year": 2014,
        "last_year": 2026,
        "provisional": [2025, 2026],
        "latest": 2024,
        "trend": [2015, 2024],
        "trend_cases": "chemo_radio",
        "quality_years": [2020, 2024],
    }


def test_shares_are_rounded_to_one_decimal_and_absent_without_cases_that_year():
    # The window is 2023–2024; 40 chemo/radio cases in it reach the minimum of 20 a year.
    counts = {
        (2023, "261160"): CaseCounts(cases=3, within_60_days=1, without_treatment_info=2, chemo_radio=40),
        (2025, "261160"): CaseCounts(cases=5, within_60_days=5, without_treatment_info=0),
        (2024, "355030"): CaseCounts(cases=3, within_60_days=1, without_treatment_info=2, chemo_radio=40),
    }

    layer = within_60_days_layer(counts, immediate_region_of={"261160": "260001", "355030": "350001"}, provisional={2025})

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

    layer = within_60_days_layer(counts, immediate_region_of=RECIFE, provisional=PROVISIONAL)

    assert layer["municipalities"]["261160"] == {
        "origin": "municipality",
        "trend": "stable",
        # The value and the % without information stay over all the 2024 cases.
        "value": 25.0,
        "without_treatment_info": 27.0,
        "quality_band": "B",
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
    immediate_region_of = {"261160": "260001", "260005": "260001", "260680": "260001"}

    layer = within_60_days_layer(counts, immediate_region_of=immediate_region_of, provisional=PROVISIONAL)

    assert layer["municipalities"]["261160"]["origin"] == "municipality"
    # 2024: (600 + 8 + 8) of (1000 + 16 + 16) cases on time; (100 + 2 + 2) without information.
    assert layer["municipalities"]["260005"] == {
        "origin": "immediate_region",
        "trend": "improving",
        "value": 59.7,
        "without_treatment_info": 10.1,
        "quality_band": "A",
    }
    assert layer["municipalities"]["260680"] == layer["municipalities"]["260005"]


def test_a_municipality_without_enough_data_nor_region_exports_no_value():
    counts = small("260005") | small("260680")
    immediate_region_of = {"260005": "260001", "260680": "260001"}

    layer = within_60_days_layer(counts, immediate_region_of=immediate_region_of, provisional=PROVISIONAL)

    # 16 a year in the region: not enough. Neither the class nor shares that would
    # reveal a handful of cases are exported.
    assert layer["municipalities"]["260005"] == {
        "origin": "insufficient",
        "trend": None,
        "value": None,
        "without_treatment_info": None,
        # The band is the UF's: it does not reveal the municipality's few cases.
        "quality_band": "A",
    }


def without_information(municipality, share, cases=1000):
    """A municipality with `share` of its cases, every year, without treatment information."""
    return {
        (year, municipality): CaseCounts(
            cases=cases,
            within_60_days=cases // 2,
            without_treatment_info=round(cases * share),
            chemo_radio=cases // 2,
            chemo_radio_within_60_days=cases // 4,
        )
        for year in YEARS
    }


def test_the_quality_band_of_each_uf_follows_its_share_without_treatment_information():
    # One municipality per UF: 15% is still A, just above it is B, 35% is already C.
    counts = (
        without_information("261160", 0.15)
        | without_information("355030", 0.151)
        | without_information("510340", 0.349)
        | without_information("130260", 0.35)
    )
    immediate_region_of = {"261160": "260001", "355030": "350001", "510340": "510001", "130260": "130001"}

    layer = within_60_days_layer(counts, immediate_region_of=immediate_region_of, provisional=PROVISIONAL)

    assert layer["quality"] == {
        "26": {"band": "A", "without_treatment_info": 15.0},
        "35": {"band": "B", "without_treatment_info": 15.1},
        "51": {"band": "B", "without_treatment_info": 34.9},
        "13": {"band": "C", "without_treatment_info": 35.0},
    }
    assert {code: entry["quality_band"] for code, entry in layer["municipalities"].items()} == {
        "261160": "A",
        "355030": "B",
        "510340": "B",
        "130260": "C",
    }


def test_the_quality_band_pools_only_the_last_five_consolidated_years():
    # 90% without information before 2020 and in the provisional 2025–2026; 10% in 2020–2024.
    counts = without_information("261160", 0.9)
    for year in range(2020, 2025):
        counts[(year, "261160")] = CaseCounts(cases=1000, without_treatment_info=100, chemo_radio=500)

    layer = within_60_days_layer(counts, immediate_region_of=RECIFE, provisional=PROVISIONAL)

    assert layer["quality"] == {"26": {"band": "A", "without_treatment_info": 10.0}}


def test_cases_with_an_unknown_municipality_of_residence_count_for_their_uf():
    # Recife: 10% without information. 1000 more cases a year in Pernambuco, municipality
    # unknown ("260000"), all without information: (100 + 1000) of 2000 is 55%.
    counts = without_information("261160", 0.1) | without_information("260000", 1.0)

    layer = within_60_days_layer(counts, immediate_region_of=RECIFE, provisional=PROVISIONAL)

    assert layer["quality"] == {"26": {"band": "C", "without_treatment_info": 55.0}}
    assert "260000" not in layer["municipalities"]
