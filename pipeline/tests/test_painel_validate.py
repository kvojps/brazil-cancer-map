import pytest

from pipeline.sources.painel import TabnetShare, compare_with_tabnet, parse_tabnet


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
        "11": TabnetShare(within_60_days=1040, cases=2234),
        "26": TabnetShare(within_60_days=1723, cases=2160),
    }


def test_shares_within_tolerance_agree_with_tabnet():
    official = {"11": TabnetShare(within_60_days=1040, cases=2234)}
    ours = {"11": TabnetShare(within_60_days=1045, cases=2240)}  # 46.55% vs 46.65%

    assert compare_with_tabnet(ours, official, year=2022) == []


def test_a_uf_off_by_more_than_the_tolerance_is_a_problem():
    official = {"11": TabnetShare(within_60_days=1040, cases=2234), "12": TabnetShare(300, 737)}
    ours = {"11": TabnetShare(within_60_days=1080, cases=2234), "12": TabnetShare(300, 737)}

    problems = compare_with_tabnet(ours, official, year=2022)

    assert len(problems) == 1
    assert "2022" in problems[0] and "UF 11" in problems[0]


def test_a_uf_missing_from_our_data_is_a_problem():
    official = {"11": TabnetShare(within_60_days=1040, cases=2234)}

    assert compare_with_tabnet({}, official, year=2022) != []
