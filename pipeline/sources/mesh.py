"""IBGE 2025 municipal mesh: geometry and immediate region of each municipality."""

import gzip
import json
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path
from typing import Any

from pipeline.download import Transport, fetch
from pipeline.paths import CLEAN_DIR, PIPELINE_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import publish_together

MESH_URL = (
    "https://geoftp.ibge.gov.br/organizacao_do_territorio/malhas_territoriais/"
    "malhas_municipais/municipio_2025/Brasil/BR_Municipios_2025.zip"
)
MUNICIPALITIES_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios"
"""IBGE's official list of municipalities: the reference for validation."""

SOURCE = {
    "name": "IBGE, Malha Municipal Digital 2025",
    "url": MESH_URL,
    "period": "2025",
    "conditions": (
        "Dados públicos do IBGE, com citação obrigatória da fonte. Termos na Nota Metodológica "
        "da malha: https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html"
    ),
}
"""Attribution carried by every exported file (spec, section 2)."""

MAX_GZIP_BYTES = 1_000_000
"""First-visit budget for the geometry (spec, section 13: ~0.6–0.9 MB gzip)."""

MAPSHAPER = PIPELINE_DIR / "node_modules" / ".bin" / "mapshaper"

SIMPLIFY = "1.5%"
"""Share of vertices kept. 1.5% lands at ~0.7 MB gzip (spec, section 13: 1–2%)."""

OPERATIONAL_AREA = r"/^\d\d0000\d$/"
"""IBGE codes of the "Áreas Operacionais" (Lagoa Mirim, Lagoa dos Patos): no health data."""

ATTRIBUTES = ["CD_MUN", "NM_MUN", "SIGLA_UF", "CD_RGI", "NM_RGI"]
GEOMETRY_PROPERTIES = ["CD_MUN", "CD_RGI"]


def build_mesh(source: Path, *, topojson: Path, attributes: Path) -> None:
    """Turn the IBGE mesh into the map's TopoJSON and the list of municipalities.

    Both outputs leave out the lagoons and carry `CD_MUN` with the 6-digit code
    used by DATASUS. The TopoJSON keeps only `CD_MUN` and `CD_RGI`, under the
    object `municipalities`.
    """
    if not MAPSHAPER.exists():
        raise FileNotFoundError(f"{MAPSHAPER} not found: run `npm ci` in pipeline/")
    topojson.parent.mkdir(parents=True, exist_ok=True)
    attributes.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            str(MAPSHAPER),
            "-i", str(source), "encoding=utf-8",
            "-filter", f"!{OPERATIONAL_AREA}.test(CD_MUN)",
            "-each", "CD_MUN = String(CD_MUN).slice(0, 6)",
            "-filter-fields", ",".join(ATTRIBUTES),
            "-rename-layers", "municipalities",
            "-o", str(attributes), "format=json", "force",
            "-filter-fields", ",".join(GEOMETRY_PROPERTIES),
            "-simplify", SIMPLIFY, "weighted", "keep-shapes",
            "-o", str(topojson), "format=topojson", "quantization=1e5", "force",
        ],
        check=True,
        capture_output=True,
        text=True,
    )


class MeshValidationError(Exception):
    pass


class MeshSource:
    """The map geometry and each municipality's immediate region."""

    name = "mesh"

    def __init__(
        self,
        *,
        raw_dir: Path = RAW_DIR / "mesh",
        clean_dir: Path = CLEAN_DIR / "mesh",
        site_data_dir: Path = SITE_DATA_DIR,
        transport: Transport | None = None,
    ) -> None:
        self._mesh_zip = raw_dir / "BR_Municipios_2025.zip"
        self._raw_reference = raw_dir / "ibge_municipalities.json"
        self._reference = clean_dir / "ibge_municipalities.json"
        self._topojson = clean_dir / "municipalities.topojson"
        self._attributes = clean_dir / "municipalities.json"
        self._site_data_dir = site_data_dir
        self._transport = transport

    def download(self) -> None:
        fetch(MESH_URL, self._mesh_zip, transport=self._transport)
        fetch(MUNICIPALITIES_URL, self._raw_reference, transport=self._transport)

    def clean(self) -> None:
        with tempfile.TemporaryDirectory() as workdir, zipfile.ZipFile(self._mesh_zip) as archive:
            for member in archive.namelist():
                if Path(member).stem == "BR_Municipios_2025":
                    archive.extract(member, workdir)
            shapefile = next(Path(workdir).rglob("BR_Municipios_2025.shp"))
            build_mesh(shapefile, topojson=self._topojson, attributes=self._attributes)
        shutil.copyfile(self._raw_reference, self._reference)

    def compute(self) -> None:
        """The mesh has no statistics."""

    def validate(self) -> None:
        """Check the mesh against IBGE's list: same municipalities, same immediate regions."""
        expected = _reference_regions(json.loads(self._reference.read_text()))
        topology = json.loads(self._topojson.read_text())
        geometries = topology["objects"]["municipalities"]["geometries"]
        on_map = {g["properties"]["CD_MUN"]: g["properties"]["CD_RGI"] for g in geometries}
        listed = {m["CD_MUN"]: m["CD_RGI"] for m in json.loads(self._attributes.read_text())}

        problems = []
        if missing := sorted(expected.keys() - on_map.keys()):
            problems.append(f"{len(missing)} municipalities missing from the mesh: {_sample(missing)}")
        if unknown := sorted(on_map.keys() - expected.keys()):
            problems.append(f"{len(unknown)} codes not in IBGE's list: {_sample(unknown)}")
        if empty := sorted(g["properties"]["CD_MUN"] for g in geometries if not g.get("type")):
            problems.append(f"{len(empty)} municipalities without geometry: {_sample(empty)}")
        if len(on_map) != len(geometries):
            problems.append("repeated municipality codes in the mesh")
        if listed != on_map:
            problems.append("the municipality list and the map geometry disagree")
        if wrong := sorted(c for c in expected.keys() & on_map.keys() if on_map[c] != expected[c]):
            problems.append(f"{len(wrong)} with an immediate region other than IBGE's: {_sample(wrong)}")
        size = len(gzip.compress(self._topojson.read_bytes(), compresslevel=9))
        if size > MAX_GZIP_BYTES:
            problems.append(f"TopoJSON is {size} bytes gzip, over the {MAX_GZIP_BYTES} budget")
        if problems:
            raise MeshValidationError("; ".join(problems))

    def export(self) -> None:
        """Publish the geometry and the municipality list, only if the mesh is valid."""
        self.validate()
        municipalities = json.loads(self._attributes.read_text())
        listing = {
            "source": SOURCE,
            "municipalities": [
                {
                    "code": m["CD_MUN"],
                    "name": m["NM_MUN"],
                    "uf": m["SIGLA_UF"],
                    "immediate_region": m["CD_RGI"],
                }
                for m in municipalities
            ],
            "immediate_regions": {m["CD_RGI"]: m["NM_RGI"] for m in municipalities},
        }
        topology = {"source": SOURCE, **json.loads(self._topojson.read_text())}
        publish_together(
            self._site_data_dir,
            {"municipalities.topojson": topology, "municipalities.json": listing},
        )


def _reference_regions(localities: list[dict[str, Any]]) -> dict[str, str]:
    """6-digit code → immediate region code, from IBGE's localities API."""
    return {str(m["id"])[:6]: str(m["regiao-imediata"]["id"]) for m in localities}


def _sample(codes: list[str]) -> str:
    return ", ".join(codes[:10]) + (", ..." if len(codes) > 10 else "")
