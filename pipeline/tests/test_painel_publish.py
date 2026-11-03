import json

import pytest

from pipeline.sources.painel import (
    CANCER_TYPES,
    CaseCounts,
    FirstTreatment,
    PainelSource,
    PainelValidationError,
    write_clean,
)
from pipeline.tests.test_painel_validate import tabnet_page

YEARS = range(2014, 2027)


def steady_months():
    """The same national cases every month: 30 surgeries, 40 chemo/radio, 30 without information."""
    per_month = {FirstTreatment.SURGERY: 30, FirstTreatment.CHEMO_RADIO: 40, FirstTreatment.WITHOUT_INFO: 30}
    return {
        (f"{year}-{month:02d}", treatment): n
        for year in YEARS
        for month in range(1, 13)
        for treatment, n in per_month.items()
    }


def build_source(
    tmp_path,
    tabnet_on_time_in_2020=600,
    chemo_radio_on_time_in_2020=200,
    tabnet_without_info_in_2020=100,
    months=None,
):
    """A Painel source whose clean step already ran: one municipality in Rondônia,
    with, for every cancer type, 1000 cases a year, 600 of them within 60 days and 100 without
    treatment information; 500 treated with chemotherapy or radiotherapy, 200 of them within 60 days."""
    raw, clean, site = tmp_path / "raw", tmp_path / "clean", tmp_path / "site"
    counts = {
        (year, "110020", cancer_type): CaseCounts(
            cases=1000,
            within_60_days=600,
            without_treatment_info=100,
            chemo_radio=500,
            chemo_radio_within_60_days=200,
        )
        for year in YEARS
        for cancer_type in CANCER_TYPES
    }
    write_clean(clean, counts, steady_months() if months is None else months, extracted_at="2026-10-17")
    (raw / "tabnet" / "chemo_radio").mkdir(parents=True)
    for year in YEARS:
        on_time = tabnet_on_time_in_2020 if year == 2020 else 600
        without_info = tabnet_without_info_in_2020 if year == 2020 else 100
        page = tabnet_page({"11 Rondônia": (on_time, 0, 1000 - on_time - without_info, without_info)})
        (raw / "tabnet" / f"{year}.html").write_text(page)
        on_time = chemo_radio_on_time_in_2020 if year == 2020 else 200
        page = tabnet_page({"11 Rondônia": (on_time, 0, 500 - on_time, 0)})
        (raw / "tabnet" / "chemo_radio" / f"{year}.html").write_text(page)
    listing = {"municipalities": [{"code": "110020", "name": "Porto Velho", "uf": "RO", "immediate_region": "110001"}]}
    (site).mkdir()
    (site / "municipalities.json").write_text(json.dumps(listing))
    return PainelSource(raw_dir=raw, clean_dir=clean, site_data_dir=site), site


def test_a_tabnet_mismatch_publishes_nothing(tmp_path):
    source, site = build_source(tmp_path, tabnet_on_time_in_2020=500)
    source.compute()

    with pytest.raises(PainelValidationError, match="2020, UF 11"):
        source.export()

    assert sorted(p.name for p in site.rglob("*")) == ["municipalities.json"]


def test_a_mismatch_in_the_share_without_information_publishes_nothing(tmp_path):
    source, site = build_source(tmp_path, tabnet_without_info_in_2020=150)
    source.compute()

    with pytest.raises(PainelValidationError, match="all cases, 2020, UF 11: 10.0% without treatment information"):
        source.export()

    assert sorted(p.name for p in site.rglob("*")) == ["municipalities.json"]


def test_a_chemo_radio_mismatch_with_tabnet_publishes_nothing(tmp_path):
    source, site = build_source(tmp_path, chemo_radio_on_time_in_2020=150)
    source.compute()

    with pytest.raises(PainelValidationError, match="chemotherapy or radiotherapy.*2020, UF 11"):
        source.export()

    assert sorted(p.name for p in site.rglob("*")) == ["municipalities.json"]


def test_the_published_layer_says_the_trend_and_the_value_are_measured_on_chemo_radio_cases(tmp_path):
    source, site = build_source(tmp_path)
    source.compute()

    source.export()

    layer = json.loads((site / "map" / "within_60_days" / "all.json").read_text())
    assert layer["period"]["trend_cases"] == "chemo_radio"
    assert layer["period"]["value_cases"] == "chemo_radio"
    assert layer["source"]["period"] == (
        "Anos de diagnóstico 2014–2026 (2025, 2026 provisórios). "
        "Tendência 2015–2024 e valor de 2024 medidos nos casos tratados com quimioterapia ou radioterapia; "
        "% sem informação de 2024 sobre todos os casos diagnosticados; "
        "faixa de qualidade 2020–2024, por UF, sobre todos os casos diagnosticados"
    )
    # 40% of the chemo/radio cases on time every year: the trend is fitted on them.
    assert layer["municipalities"]["110020"]["trend"] == "stable"


def test_a_valid_run_publishes_the_layer_and_the_manifest(tmp_path):
    source, site = build_source(tmp_path)
    source.compute()

    source.export()

    layer = json.loads((site / "map" / "within_60_days" / "all.json").read_text())
    assert layer["indicator"] == "within_60_days"
    assert layer["cancer_type"] == "all"
    assert layer["source"]["name"].startswith("Painel-Oncologia")
    # 200 of the 500 chemo/radio cases of 2024 on time.
    assert layer["municipalities"]["110020"]["value"] == 40.0
    manifest = json.loads((site / "manifest.json").read_text())
    assert manifest["pipeline_version"]
    assert manifest["sources"]["painel"]["extracted_at"] == "2026-10-17"
    assert manifest["indicators"]["within_60_days"]["all"] == layer["period"]


def test_a_monthly_drop_alerts_the_maintainer_and_still_publishes(tmp_path, capsys):
    months = steady_months()
    months[("2024-04", FirstTreatment.SURGERY)] = 10
    source, site = build_source(tmp_path, months=months)
    source.compute()

    source.validate()
    source.export()

    assert (site / "map" / "within_60_days" / "all.json").exists()
    assert capsys.readouterr().err == (
        "painel: alert: surgery, 2024-04: 10 cases, 33% of the median of the 12 months before (30)\n"
    )


def test_the_manifest_keeps_what_other_sources_wrote(tmp_path):
    source, site = build_source(tmp_path)
    (site / "manifest.json").write_text(json.dumps({"sources": {"mesh": {"extracted_at": "2026-02-26"}}}))
    source.compute()

    source.export()

    manifest = json.loads((site / "manifest.json").read_text())
    assert manifest["sources"].keys() == {"mesh", "painel"}


def test_the_published_layer_carries_the_quality_band_and_its_period(tmp_path):
    source, site = build_source(tmp_path)
    source.compute()

    source.export()

    layer = json.loads((site / "map" / "within_60_days" / "all.json").read_text())
    # 100 of 1000 cases a year without treatment information in Rondônia.
    assert layer["quality"] == {"11": {"band": "A", "without_treatment_info": 10.0}}
    assert layer["municipalities"]["110020"]["quality_band"] == "A"
    assert "faixa de qualidade 2020–2024" in layer["source"]["period"]
    manifest = json.loads((site / "manifest.json").read_text())
    assert manifest["indicators"]["within_60_days"]["all"]["quality_years"] == [2020, 2024]


def test_a_uf_without_a_quality_band_publishes_nothing(tmp_path):
    source, site = build_source(tmp_path)
    listing = json.loads((site / "municipalities.json").read_text())
    listing["municipalities"].append({"code": "120040", "name": "Rio Branco", "uf": "AC", "immediate_region": "120001"})
    (site / "municipalities.json").write_text(json.dumps(listing))
    source.compute()

    with pytest.raises(PainelValidationError, match="without a quality band: 12"):
        source.export()

    assert sorted(p.name for p in site.rglob("*")) == ["municipalities.json"]


def test_a_valid_run_publishes_a_layer_for_each_cancer_type(tmp_path):
    source, site = build_source(tmp_path)
    source.compute()

    source.export()

    published = sorted(p.stem for p in (site / "map" / "within_60_days").glob("*.json"))
    assert published == ["all", "breast", "cervix", "colorectal", "lung", "prostate"]
    manifest = json.loads((site / "manifest.json").read_text())
    assert sorted(manifest["indicators"]["within_60_days"]) == published
    for cancer_type in published:
        layer = json.loads((site / "map" / "within_60_days" / f"{cancer_type}.json").read_text())
        assert layer["cancer_type"] == cancer_type
        assert layer["municipalities"]["110020"]["trend"] == "stable"
        assert layer["quality"]["11"]["band"] == "A"


def test_prostate_has_no_status(tmp_path):
    # Active surveillance is correct care in prostate cancer: no Situação against the 60 days.
    source, site = build_source(tmp_path)
    source.compute()

    source.export()

    def has_status(cancer_type):
        return json.loads((site / "map" / "within_60_days" / f"{cancer_type}.json").read_text())["has_status"]

    assert not has_status("prostate")
    assert all(has_status(t) for t in ("all", "breast", "cervix", "colorectal", "lung"))


def test_profiles_publish_complete_chemo_radio_series_and_uf_context(tmp_path):
    source, site = build_source(tmp_path)
    source.compute()
    source.export()

    profile = json.loads((site / "profiles" / "RO.json").read_text())
    types = profile["indicators"]["within_60_days"]
    assert set(types) == set(CANCER_TYPES)
    treatment = types["all"]
    entry = treatment["municipalities"]["110020"]
    assert entry["value"] == 40.0
    assert treatment["uf_trend"] == "stable"
    assert treatment["series"][entry["series_id"]] == [
        {"year": year, "value": 40.0, "without_treatment_info": 10.0, "provisional": year >= 2025}
        for year in YEARS
    ]
    assert types["prostate"]["reference"] is None
    assert not types["prostate"]["has_status"]


def test_profiles_use_the_region_series_and_hide_insufficient_local_series(tmp_path):
    source, site = build_source(tmp_path)
    listing_path = site / "municipalities.json"
    listing = json.loads(listing_path.read_text())
    listing["municipalities"] += [
        {"code": "110001", "name": "Neighbor", "uf": "RO", "immediate_region": "110001"},
        {"code": "110002", "name": "Small", "uf": "RO", "immediate_region": "110002"},
    ]
    listing_path.write_text(json.dumps(listing))
    source.compute()
    source.export()

    treatment = json.loads((site / "profiles" / "RO.json").read_text())["indicators"]["within_60_days"]["all"]
    neighbor = treatment["municipalities"]["110001"]
    assert neighbor["origin"] == "immediate_region"
    assert neighbor["value"] == 40.0
    assert treatment["series"][neighbor["series_id"]][0]["value"] == 40.0
    small = treatment["municipalities"]["110002"]
    assert small["origin"] == "insufficient"
    assert small["series_id"] is None
    assert small["value"] is None
    assert "110002" not in treatment["series"]
    assert treatment["uf_trend"] == "stable"
