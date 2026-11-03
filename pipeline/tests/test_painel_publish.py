import json

import pytest

from pipeline.sources.painel import (
    CaseCounts,
    PainelSource,
    PainelValidationError,
    write_clean,
)
from pipeline.tests.test_painel_validate import tabnet_page

YEARS = range(2014, 2027)


def build_source(tmp_path, tabnet_on_time_in_2020=600):
    """A Painel source whose clean step already ran: one municipality in Rondônia,
    1000 cases a year, 600 of them within 60 days."""
    raw, clean, site = tmp_path / "raw", tmp_path / "clean", tmp_path / "site"
    counts = {
        (year, "110020", "all"): CaseCounts(cases=1000, within_60_days=600, without_treatment_info=100)
        for year in YEARS
    }
    write_clean(clean, counts, extracted_at="2026-10-17")
    for year in YEARS:
        on_time = tabnet_on_time_in_2020 if year == 2020 else 600
        page = tabnet_page({"11 Rondônia": (on_time, 0, 900 - on_time, 100)})
        (raw / "tabnet").mkdir(parents=True, exist_ok=True)
        (raw / "tabnet" / f"{year}.html").write_text(page)
    listing = {"municipalities": [{"code": "110020", "name": "Porto Velho", "uf": "RO"}]}
    (site).mkdir()
    (site / "municipalities.json").write_text(json.dumps(listing))
    return PainelSource(raw_dir=raw, clean_dir=clean, site_data_dir=site), site


def test_a_tabnet_mismatch_publishes_nothing(tmp_path):
    source, site = build_source(tmp_path, tabnet_on_time_in_2020=500)
    source.compute()

    with pytest.raises(PainelValidationError, match="2020, UF 11"):
        source.export()

    assert sorted(p.name for p in site.rglob("*")) == ["municipalities.json"]


def test_a_valid_run_publishes_the_layer_and_the_manifest(tmp_path):
    source, site = build_source(tmp_path)
    source.compute()

    source.export()

    layer = json.loads((site / "map" / "within_60_days" / "all.json").read_text())
    assert layer["indicator"] == "within_60_days"
    assert layer["cancer_type"] == "all"
    assert layer["source"]["name"].startswith("Painel-Oncologia")
    assert layer["municipalities"]["110020"]["value"] == 60.0
    manifest = json.loads((site / "manifest.json").read_text())
    assert manifest["pipeline_version"]
    assert manifest["sources"]["painel"]["extracted_at"] == "2026-10-17"
    assert manifest["indicators"]["within_60_days"]["all"] == layer["period"]


def test_the_manifest_keeps_what_other_sources_wrote(tmp_path):
    source, site = build_source(tmp_path)
    (site / "manifest.json").write_text(json.dumps({"sources": {"mesh": {"extracted_at": "2026-02-26"}}}))
    source.compute()

    source.export()

    manifest = json.loads((site / "manifest.json").read_text())
    assert manifest["sources"].keys() == {"mesh", "painel"}
