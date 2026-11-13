import pytest

from pipeline.sources.painel.models import UfShare
from pipeline.sources.painel.validation import compare_with_tabnet
from pipeline.sources.painel.acquisition import parse_tabnet


def tabnet_page(rows):
    """A TabNet result page as `webtabx.exe` returns it, trimmed to the table script."""
    lines = ",\n".join(
        f'["{uf}" ,{{v: {a}.0 ,f: \'{a}\'}} ,{{v: {b}.0 ,f: \'{b}\'}} ,{{v: {c}.0 ,f: \'{c}\'}} '
        f",{{v: {d}.0 ,f: '{d}'}} ,{{v: {a + b + c + d}.0 ,f: '{a + b + c + d}'}} ]"
        for uf, (a, b, c, d) in rows.items()
    )
    return f"""<html><script>
        data.addColumn('string','UF da residência');
        data.addColumn('number','Até 30 dias');
        data.addColumn('number','31 - 60 dias');
        data.addColumn('number','Mais de 60');
        data.addColumn('number','Sem informação de tratamento');
        data.addColumn('number',' Total');
        data.addRows([
{lines}
        ]);
</script></html>"""


def test_tabnet_page_gives_the_cases_within_60_days_by_uf():
    page = tabnet_page({" Total": (1910, 853, 1123, 508), "11 Rondônia": (635, 405, 739, 455), "26 Pernambuco": (1275, 448, 384, 53)})

    shares = parse_tabnet(page)

    assert shares == {
        "11": UfShare(within_60_days=1040, cases=2234, without_treatment_info=455),
        "26": UfShare(within_60_days=1723, cases=2160, without_treatment_info=53),
    }


def test_shares_within_tolerance_agree_with_tabnet():
    official = {"11": UfShare(within_60_days=1040, cases=2234)}
    ours = {"11": UfShare(within_60_days=1045, cases=2240)}  # 46.55% vs 46.65%

    assert compare_with_tabnet(ours, official, year=2022) == []


def test_a_uf_off_by_more_than_the_tolerance_is_a_problem():
    official = {"11": UfShare(within_60_days=1040, cases=2234), "12": UfShare(300, 737)}
    ours = {"11": UfShare(within_60_days=1080, cases=2234), "12": UfShare(300, 737)}

    problems = compare_with_tabnet(ours, official, year=2022)

    assert len(problems) == 1
    assert "2022" in problems[0] and "UF 11" in problems[0]


def test_a_uf_missing_from_our_data_is_a_problem():
    official = {"11": UfShare(within_60_days=1040, cases=2234)}

    assert compare_with_tabnet({}, official, year=2022) != []


def test_tabnet_page_gives_the_cases_without_treatment_information_by_uf():
    page = tabnet_page({"11 Rondônia": (635, 405, 739, 455)})

    assert parse_tabnet(page)["11"].without_treatment_info == 455


def test_a_tabnet_page_without_the_column_has_no_case_without_information():
    # Filtered by chemotherapy or radiotherapy, TabNet leaves out the empty column.
    page = tabnet_page({"11 Rondônia": (635, 405, 739, 0)}).replace(
        "        data.addColumn('number','Sem informação de tratamento');\n", ""
    ).replace(" ,{v: 0.0 ,f: '0'}", "")

    assert parse_tabnet(page) == {"11": UfShare(within_60_days=1040, cases=1779, without_treatment_info=0)}


def test_a_uf_off_in_the_share_without_information_is_a_problem():
    official = {"11": UfShare(within_60_days=1040, cases=2234, without_treatment_info=455)}
    ours = {"11": UfShare(within_60_days=1040, cases=2234, without_treatment_info=500)}  # 20.4% vs 22.4%

    problems = compare_with_tabnet(ours, official, year=2022)

    assert problems == ["2022, UF 11: 22.4% without treatment information, TabNet 20.4%"]


def test_a_uf_off_in_the_number_of_cases_is_a_problem():
    # Same shares, but 10% more cases than TabNet: rows were lost or doubled.
    official = {"11": UfShare(within_60_days=1000, cases=2000, without_treatment_info=400)}
    ours = {"11": UfShare(within_60_days=1100, cases=2200, without_treatment_info=440)}

    problems = compare_with_tabnet(ours, official, year=2022)

    assert problems == ["2022, UF 11: 2200 cases, TabNet 2000"]


def test_a_gap_in_cases_within_the_tolerance_agrees_with_tabnet():
    official = {"11": UfShare(within_60_days=1000, cases=2000, without_treatment_info=400)}
    ours = {"11": UfShare(within_60_days=1005, cases=2010, without_treatment_info=402)}

    assert compare_with_tabnet(ours, official, year=2022) == []
