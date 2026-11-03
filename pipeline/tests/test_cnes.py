import json

import duckdb
import pytest

from pipeline.sources.cnes import CnesSource, CnesValidationError, clean_facilities, nearby_facilities


def habilitation(code="1707", start="202001", end="999999"):
    return {"CNES": "0000001", "CODUFMUN": "261160", "SGRUPHAB": code,
            "CMPT_INI": start, "CMPT_FIM": end, "COMPETEN": "202609"}


def test_current_oncology_habilitations_are_joined_and_deduplicated():
    rows = [habilitation(), habilitation(), habilitation("1712"),
            habilitation("1714"), habilitation("1706", end="202608"),
            habilitation("1715", start="202610")]
    facilities = clean_facilities(rows, {"0000001": "Hospital de teste"}, "202609")
    assert facilities == [{"cnes": "0000001", "municipality": "261160",
                           "name": "Hospital de teste", "habilitations": ["1707", "1712"]}]


def test_nearest_services_cross_state_borders_and_keep_radiotherapy_visible():
    facilities = [
        {"cnes": "1", "municipality": "a", "name": "Local", "habilitations": ["1706"]},
        {"cnes": "2", "municipality": "b", "name": "Vizinho", "habilitations": ["1712"]},
        {"cnes": "3", "municipality": "c", "name": "Outro", "habilitations": ["1706"]},
        {"cnes": "4", "municipality": "d", "name": "Radio", "habilitations": ["1715"]},
    ]
    # One degree at the equator is about 111.2 km; there is no state filter.
    result = nearby_facilities(facilities, {"a": (0, 0), "b": (1, 0), "c": (2, 0), "d": (3, 0)})
    assert result["a"] == [
        {"cnes": "1", "distance_km": 0.0}, {"cnes": "2", "distance_km": 111.2},
        {"cnes": "3", "distance_km": 222.4}, {"cnes": "4", "distance_km": 333.6},
    ]


def test_export_rechecks_uf_counts_and_preserves_previous_publication(tmp_path):
    raw, clean, site = (tmp_path / name for name in ("raw", "clean", "site"))
    for directory in (raw, clean, site):
        directory.mkdir()
    (site / "municipalities.json").write_text(json.dumps({"municipalities": [
        {"code": "261160", "name": "Recife", "uf": "PE"},
    ]}))
    (clean / "extract.json").write_text(json.dumps({"period": "202609", "extracted_at": "2026-11-03"}))
    with duckdb.connect() as db:
        db.execute("CREATE TABLE facilities (cnes VARCHAR, municipality VARCHAR, name VARCHAR, habilitations VARCHAR[])")
        db.execute("INSERT INTO facilities VALUES ('0000001', '261160', 'Hospital', ['1707'])")
        db.execute("COPY facilities TO ? (FORMAT PARQUET)", [str(clean / "facilities.parquet")])
    (clean / "nearby.json").write_text(json.dumps({"261160": [{"cnes": "0000001", "distance_km": 0}]}))
    (site / "profiles").mkdir()
    profile_path = site / "profiles/PE.json"
    profile_path.write_text(json.dumps({"uf": "PE", "indicators": {"existing": {"preserved": True}}}))
    source = CnesSource(raw_dir=raw, clean_dir=clean, site_data_dir=site)
    # Pernambuco has many oncology habilitations; one is an implausible extraction.
    previous = profile_path.read_bytes()
    with pytest.raises(CnesValidationError, match="PE"):
        source.export()
    assert profile_path.read_bytes() == previous
    assert not (site / "manifest.json").exists()


def test_download_selects_the_latest_month_complete_for_both_files_and_all_states(tmp_path, monkeypatch):
    from pipeline.sources import cnes

    def listing(url):
        kind = "HB" if "/HB/" in url else "ST"
        names = [f"{kind}{uf}2609.dbc" for uf in cnes.UF_COUNT_RANGES]
        names += [f"{kind}{uf}2610.dbc" for uf in cnes.UF_COUNT_RANGES if uf != "RR" or kind == "HB"]
        return names + [f"{kind}ufAAmm.dbc"]

    downloaded = []

    def download(url, destination):
        downloaded.append(url)

    monkeypatch.setattr(cnes, "list_ftp", listing)
    monkeypatch.setattr(cnes, "fetch", download)
    source = CnesSource(raw_dir=tmp_path, clean_dir=tmp_path / "clean", site_data_dir=tmp_path / "site")
    source.download()
    extract = json.loads((tmp_path / "extract.json").read_text())
    assert extract["period"] == "202609"
    assert len(extract["files"]) == 54
    assert len(downloaded) == 55
    assert not any("2610" in url for url in downloaded)


def test_missing_facility_names_fail_instead_of_publishing_a_code_as_a_name():
    with pytest.raises(ValueError, match="no facility name"):
        clean_facilities([habilitation()], {}, "202609")


def test_successful_export_merges_profiles_and_manifest_without_map_layers(tmp_path):
    raw, clean, site = (tmp_path / name for name in ("raw", "clean", "site"))
    clean.mkdir()
    (site / "profiles").mkdir(parents=True)
    # Representative complete counts, fixed independently of the validator's bounds.
    states = {
        "AC": ("12", 1), "AL": ("27", 5), "AM": ("13", 3), "AP": ("16", 1),
        "BA": ("29", 25), "CE": ("23", 15), "DF": ("53", 5), "ES": ("32", 10),
        "GO": ("52", 15), "MA": ("21", 7), "MG": ("31", 50), "MS": ("50", 8),
        "MT": ("51", 8), "PA": ("15", 10), "PB": ("25", 8), "PE": ("26", 20),
        "PI": ("22", 5), "PR": ("41", 35), "RJ": ("33", 35), "RN": ("24", 8),
        "RO": ("11", 3), "RR": ("14", 1), "RS": ("43", 40), "SC": ("42", 25),
        "SE": ("28", 5), "SP": ("35", 100), "TO": ("17", 3),
    }
    listing, rows, nearby = [], [], {}
    for uf, (prefix, count) in states.items():
        code = prefix + "0001"
        listing.append({"code": code, "name": uf + " city", "uf": uf})
        for index in range(count):
            rows.append((f"{prefix}{index:05}", code, f"Hospital {uf} {index}", ["1707"]))
        nearby[code] = [{"cnes": f"{prefix}00000", "distance_km": 0}]
    (site / "municipalities.json").write_text(json.dumps({"municipalities": listing}))
    (site / "profiles/PE.json").write_text(json.dumps({"uf": "PE", "indicators": {"existing": True}}))
    (site / "manifest.json").write_text(json.dumps({"sources": {"painel": {"extracted_at": "old"}}, "indicators": {"existing": True}}))
    (clean / "extract.json").write_text(json.dumps({"period": "202609", "extracted_at": "2026-11-03"}))
    (clean / "nearby.json").write_text(json.dumps(nearby))
    with duckdb.connect() as db:
        db.execute("CREATE TABLE facilities (cnes VARCHAR, municipality VARCHAR, name VARCHAR, habilitations VARCHAR[])")
        db.executemany("INSERT INTO facilities VALUES (?, ?, ?, ?)", rows)
        db.execute("COPY facilities TO ? (FORMAT PARQUET)", [str(clean / "facilities.parquet")])
    source = CnesSource(raw_dir=raw, clean_dir=clean, site_data_dir=site)
    source.export()
    profile = json.loads((site / "profiles/PE.json").read_text())
    assert profile["indicators"] == {"existing": True}
    assert profile["where_to_treat"]["period"] == "202609"
    assert profile["where_to_treat"]["facilities"]["2600000"]["habilitations"] == [
        {"code": "1707", "label": "UNACON com serviço de radioterapia"},
    ]
    manifest = json.loads((site / "manifest.json").read_text())
    assert manifest["sources"]["painel"] == {"extracted_at": "old"}
    assert manifest["indicators"]["existing"] is True
    assert len(list((site / "profiles").glob("*.json"))) == 27
    assert not (site / "map").exists()
