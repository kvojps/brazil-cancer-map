import json

import pytest

from pipeline.sources.mesh import MeshSource, MeshValidationError

PELOTAS = ("431440", "Pelotas", "RS", "430018", "Pelotas")
CAPAO = ("430463", "Capão do Leão", "RS", "430018", "Pelotas")
SORRISO = ("510792", "Sorriso", "MT", "510008", "Sorriso")


def reference_entry(code, name, region):
    """One municipality as IBGE's localities API returns it (7-digit ids)."""
    check_digit = "0"
    return {"id": int(code + check_digit), "nome": name, "regiao-imediata": {"id": int(region)}}


def make_source(tmp_path, mesh, reference):
    """MeshSource whose clean mesh holds `mesh` and whose IBGE list holds `reference`."""
    raw = tmp_path / "raw"
    clean = tmp_path / "clean"
    raw.mkdir()
    clean.mkdir()
    (raw / "ibge_municipalities.json").write_text(
        json.dumps([reference_entry(code, name, rgi) for code, name, _, rgi, _ in reference])
    )
    (clean / "municipalities.json").write_text(
        json.dumps(
            [
                {"CD_MUN": code, "NM_MUN": name, "SIGLA_UF": uf, "CD_RGI": rgi, "NM_RGI": rgi_name}
                for code, name, uf, rgi, rgi_name in mesh
            ]
        )
    )
    (clean / "municipalities.topojson").write_text(
        json.dumps(
            {
                "type": "Topology",
                "arcs": [],
                "objects": {
                    "municipalities": {
                        "type": "GeometryCollection",
                        "geometries": [
                            {"type": None, "properties": {"CD_MUN": code, "CD_RGI": rgi}}
                            for code, _, _, rgi, _ in mesh
                        ],
                    }
                },
            }
        )
    )
    site = tmp_path / "site" / "dados"
    return MeshSource(raw_dir=raw, clean_dir=clean, site_data_dir=site), site


def test_complete_mesh_is_published_with_the_municipality_list(tmp_path):
    source, site = make_source(tmp_path, mesh=[PELOTAS, CAPAO], reference=[PELOTAS, CAPAO])

    source.validate()
    source.export()

    topology = json.loads((site / "municipalities.topojson").read_text())
    assert [g["properties"]["CD_MUN"] for g in topology["objects"]["municipalities"]["geometries"]] == [
        "431440",
        "430463",
    ]
    listing = json.loads((site / "municipalities.json").read_text())
    assert listing["municipalities"] == [
        {"code": "431440", "name": "Pelotas", "uf": "RS", "immediate_region": "430018"},
        {"code": "430463", "name": "Capão do Leão", "uf": "RS", "immediate_region": "430018"},
    ]
    assert listing["immediate_regions"] == {"430018": "Pelotas"}
    assert "IBGE" in listing["source"]["name"]


def test_missing_municipality_fails_validation_and_nothing_is_published(tmp_path):
    source, site = make_source(tmp_path, mesh=[PELOTAS], reference=[PELOTAS, CAPAO])
    site.mkdir(parents=True)
    (site / "municipalities.topojson").write_text("last valid version")

    with pytest.raises(MeshValidationError, match="430463"):
        source.validate()
    with pytest.raises(MeshValidationError):
        source.export()

    assert (site / "municipalities.topojson").read_text() == "last valid version"
    assert not (site / "municipalities.json").exists()


def test_municipality_outside_the_ibge_list_fails_validation(tmp_path):
    source, _ = make_source(tmp_path, mesh=[PELOTAS, CAPAO, SORRISO], reference=[PELOTAS, CAPAO])

    with pytest.raises(MeshValidationError, match="510792"):
        source.validate()


def test_wrong_immediate_region_fails_validation(tmp_path):
    wrong_region = ("430463", "Capão do Leão", "RS", "430099", "Elsewhere")
    source, _ = make_source(tmp_path, mesh=[PELOTAS, wrong_region], reference=[PELOTAS, CAPAO])

    with pytest.raises(MeshValidationError, match="430463"):
        source.validate()
