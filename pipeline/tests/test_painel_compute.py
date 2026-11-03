from pipeline.sources.painel import CaseCounts, within_60_days_layer

YEARS = range(2014, 2027)
PROVISIONAL = {2025, 2026}


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
    layer = within_60_days_layer(rising("261160"), municipalities=["261160", "510183"], provisional=PROVISIONAL)

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

    layer = within_60_days_layer(counts, municipalities=["261160"], provisional=PROVISIONAL)

    # 2024 is the 11th year: 30% + 10 × 3 points = 60%; 100 of 1000 without information.
    assert layer["municipalities"]["261160"] == {
        "origin": "municipality",
        "trend": "improving",
        "value": 60.0,
        "without_treatment_info": 10.0,
    }


def test_the_layer_states_its_period():
    layer = within_60_days_layer(rising("261160"), municipalities=["261160"], provisional=PROVISIONAL)

    assert layer["period"] == {
        "first_year": 2014,
        "last_year": 2026,
        "provisional": [2025, 2026],
        "latest": 2024,
        "trend": [2015, 2024],
        "trend_cases": "chemo_radio",
    }


def test_shares_are_rounded_to_one_decimal_and_absent_without_cases_that_year():
    counts = {
        (2023, "261160"): CaseCounts(cases=3, within_60_days=1, without_treatment_info=2),
        (2025, "261160"): CaseCounts(cases=5, within_60_days=5, without_treatment_info=0),
        (2024, "355030"): CaseCounts(cases=3, within_60_days=1, without_treatment_info=2),
    }

    layer = within_60_days_layer(counts, municipalities=["261160", "355030"], provisional={2025})

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

    layer = within_60_days_layer(counts, municipalities=["261160"], provisional=PROVISIONAL)

    assert layer["municipalities"]["261160"] == {
        "origin": "municipality",
        "trend": "stable",
        # The value and the % without information stay over all the 2024 cases.
        "value": 25.0,
        "without_treatment_info": 27.0,
    }
