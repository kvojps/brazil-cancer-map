import json

from pipeline.sources.mesh import build_mesh


def square(x, y):
    return {"type": "Polygon", "coordinates": [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]]}


def feature(cd_mun, name, cd_rgi, x):
    return {
        "type": "Feature",
        "geometry": square(x, 0),
        "properties": {
            "CD_MUN": cd_mun,
            "NM_MUN": name,
            "SIGLA_UF": "RS",
            "CD_RGI": cd_rgi,
            "NM_RGI": "Pelotas",
            "AREA_KM2": 123.4,
        },
    }


def test_build_drops_the_lagoons_and_keeps_the_6_digit_code_and_immediate_region(tmp_path):
    source = tmp_path / "BR_Municipios_2025.geojson"
    source.write_text(
        json.dumps(
            {
                "type": "FeatureCollection",
                "features": [
                    feature("4314407", "Pelotas", "430018", 0),
                    feature("4304630", "Capão do Leão", "430018", 1),
                    feature("4300001", "Lagoa Mirim", "", 2),
                    feature("4300002", "Lagoa dos Patos", "", 3),
                ],
            }
        )
    )
    topojson = tmp_path / "out" / "municipalities.topojson"
    attributes = tmp_path / "out" / "municipalities.json"

    build_mesh(source, topojson=topojson, attributes=attributes)

    topology = json.loads(topojson.read_text())
    assert topology["type"] == "Topology"
    geometries = topology["objects"]["municipalities"]["geometries"]
    assert [g["properties"] for g in geometries] == [
        {"CD_MUN": "431440", "CD_RGI": "430018"},
        {"CD_MUN": "430463", "CD_RGI": "430018"},
    ]
    assert all(g["type"] == "Polygon" for g in geometries)

    assert json.loads(attributes.read_text()) == [
        {"CD_MUN": "431440", "NM_MUN": "Pelotas", "SIGLA_UF": "RS", "CD_RGI": "430018", "NM_RGI": "Pelotas"},
        {"CD_MUN": "430463", "NM_MUN": "Capão do Leão", "SIGLA_UF": "RS", "CD_RGI": "430018", "NM_RGI": "Pelotas"},
    ]
