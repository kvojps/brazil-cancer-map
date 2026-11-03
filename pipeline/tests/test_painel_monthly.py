from pipeline.sources.painel import FirstTreatment, monthly_drops

SURGERY, CHEMO_RADIO = FirstTreatment.SURGERY, FirstTreatment.CHEMO_RADIO


def months(per_month, years=range(2022, 2026)):
    """Cases by diagnosis month and first treatment, `per_month[treatment]` every month."""
    return {
        (f"{year}-{month:02d}", treatment): n
        for year in years
        for month in range(1, 13)
        for treatment, n in per_month.items()
    }


def test_a_month_far_below_the_previous_year_raises_an_alert():
    counts = months({SURGERY: 6000, CHEMO_RADIO: 15000})
    counts[("2024-04", SURGERY)] = 4400

    assert monthly_drops(counts, provisional={2025, 2026}) == [
        "surgery, 2024-04: 4400 cases, 73% of the median of the 12 months before (6000)",
    ]


def test_an_ordinary_dip_raises_no_alert():
    counts = months({SURGERY: 6000, CHEMO_RADIO: 15000})
    counts[("2024-12", SURGERY)] = 5000  # 83%: December has fewer diagnoses

    assert monthly_drops(counts, provisional={2025, 2026}) == []


def test_provisional_months_raise_no_alert():
    # The latest years are still filling in: their months are low for that reason alone.
    counts = months({SURGERY: 6000, CHEMO_RADIO: 15000})
    counts[("2025-06", CHEMO_RADIO)] = 1000

    assert monthly_drops(counts, provisional={2025, 2026}) == []


def test_months_without_a_full_year_before_raise_no_alert():
    counts = months({SURGERY: 6000})
    counts[("2022-06", SURGERY)] = 1000

    assert monthly_drops(counts, provisional=set()) == []


def test_a_lasting_drop_alerts_every_month_until_it_becomes_the_median():
    counts = months({SURGERY: 6000})
    for month in range(4, 13):
        counts[(f"2024-{month:02d}", SURGERY)] = 2000

    alerted = [alert.split(":")[0] for alert in monthly_drops(counts, provisional={2026})]

    # The 12 months before October 2024 are 6 high and 6 low: the median is 4000, twice 2000.
    # From November 2024 the low months are the median, and the new level is the norm.
    assert alerted == [f"surgery, 2024-{m:02d}" for m in range(4, 11)]


def test_a_month_without_any_case_of_a_treatment_raises_an_alert():
    counts = months({SURGERY: 6000, CHEMO_RADIO: 15000})
    del counts[("2024-04", CHEMO_RADIO)]

    assert monthly_drops(counts, provisional={2025, 2026}) == [
        "chemo_radio, 2024-04: 0 cases, 0% of the median of the 12 months before (15000)",
    ]


def test_a_month_missing_from_all_treatments_is_counted_as_zero():
    counts = months({treatment: 100 for treatment in FirstTreatment})
    for treatment in FirstTreatment:
        del counts[("2024-04", treatment)]

    assert monthly_drops(counts, provisional={2025, 2026}) == [
        f"{treatment.value}, 2024-04: 0 cases, 0% of the median of the 12 months before (100)"
        for treatment in FirstTreatment
    ]
