from pipeline.sources.painel import CaseCounts, count_cases, provisional_years


def record(cid="C50", year="2020", municipality="261160", treatment="2", days="+0030"):
    """One Painel-Oncologia row, with the fields as `dbfread` yields them."""
    return {
        "ANO_DIAGN": year,
        "MUN_RESID": municipality,
        "DIAG_DETH": cid,
        "TRATAMENTO": treatment,
        "TEMPO_TRAT": days,
    }


def test_all_cancers_for_treatment_leaves_out_c44_c73_and_c76_to_c80():
    kept = ["C00", "C50", "C75", "C81", "C97"]
    dropped = ["C44", "C73", "C76", "C77", "C78", "C79", "C80", "D05", "D46"]

    counts = count_cases(record(cid=cid) for cid in kept + dropped)

    assert counts[(2020, "261160", "all")].cases == len(kept)


def test_buckets_follow_the_tabnet_edges():
    rows = [
        record(days="+0000"),  # same day
        record(days="+0060"),  # last day inside the legal deadline
        record(days="-0090"),  # treated up to 90 days before diagnosis counts as on time
        record(days="+0061"),  # late
        record(days="-0091"),  # outside TabNet's window: not on time
        record(treatment="5", days="99999"),  # no treatment recorded
        record(treatment="5", days=""),
    ]

    counts = count_cases(rows)[(2020, "261160", "all")]

    assert counts == CaseCounts(
        cases=7, within_60_days=3, without_treatment_info=2, chemo_radio=5, chemo_radio_within_60_days=3
    )


def test_counts_are_per_diagnosis_year_and_municipality_of_residence():
    rows = [
        record(year="2019", municipality="261160"),
        record(year="2020", municipality="261160"),
        record(year="2020", municipality="261160", days="+0200"),
        record(year="2020", municipality="355030"),
    ]

    counts = count_cases(rows)

    assert counts == {
        (2019, "261160", "all"): CaseCounts(1, 1, 0, chemo_radio=1, chemo_radio_within_60_days=1),
        (2020, "261160", "all"): CaseCounts(2, 1, 0, chemo_radio=2, chemo_radio_within_60_days=1),
        (2020, "355030", "all"): CaseCounts(1, 1, 0, chemo_radio=1, chemo_radio_within_60_days=1),
    }


def test_the_two_latest_diagnosis_years_are_provisional():
    # The FTP has POBR2014…POBR2026, 2026 still partial: 2025 and 2026 are provisional.
    assert provisional_years(range(2014, 2027)) == {2025, 2026}


def test_chemo_radio_cases_are_counted_apart_with_the_same_60_day_rule():
    rows = [
        record(treatment="1", days="+0010"),  # surgery: outside the trend's cases
        record(treatment="2", days="+0030"),  # chemotherapy, on time
        record(treatment="3", days="-0090"),  # radiotherapy, treated before diagnosis: on time
        record(treatment="4", days="+0061"),  # both, late
        record(treatment="5", days=""),  # no treatment information
    ]

    counts = count_cases(rows)[(2020, "261160", "all")]

    assert counts == CaseCounts(
        cases=5,
        within_60_days=3,
        without_treatment_info=1,
        chemo_radio=3,
        chemo_radio_within_60_days=2,
    )
