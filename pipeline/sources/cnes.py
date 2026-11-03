"""Current CNES oncology habilitations and nearby services for municipality profiles."""

import json
import re
import struct
import subprocess
import tempfile
import zipfile
from collections.abc import Iterable, Mapping
from datetime import datetime, timezone
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from typing import Any

import datasus_dbc
import dbfread
import duckdb

from pipeline.download import fetch, list_ftp
from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.sources.mesh import MAPSHAPER

FTP_ROOT = "ftp://ftp.datasus.gov.br/dissemin/publicos/CNES/200508_/"
SOURCE = {"name": "Ministério da Saúde/DATASUS — CNES", "url": FTP_ROOT,
          "conditions": "Dados públicos do CNES. Cite Ministério da Saúde/DATASUS, competência e extração."}
UF_COUNT_RANGES = {
    "AC": (1, 10), "AL": (2, 25), "AM": (1, 20), "AP": (1, 10), "BA": (10, 100),
    "CE": (5, 70), "DF": (2, 30), "ES": (4, 50), "GO": (5, 60), "MA": (2, 35),
    "MG": (20, 180), "MS": (3, 35), "MT": (3, 35), "PA": (3, 40), "PB": (3, 35),
    "PE": (5, 70), "PI": (2, 30), "PR": (15, 130), "RJ": (15, 130), "RN": (3, 35),
    "RO": (1, 20), "RR": (1, 10), "RS": (15, 140), "SC": (10, 90), "SE": (2, 25),
    "SP": (40, 300), "TO": (1, 20),
}
"""Broad editorial sanity bounds for distinct active facility × habilitation pairs.

These detect incomplete state loads and runaway duplication; they are not targets.
The public methodology records the bounds and their limitations.
"""

HABILITATIONS = {
    "1704": "Serviço isolado de radioterapia",
    "1706": "UNACON",
    "1707": "UNACON com serviço de radioterapia",
    "1708": "UNACON com serviço de hematologia",
    "1709": "UNACON com serviço de oncologia pediátrica",
    "1710": "UNACON exclusiva de hematologia",
    "1711": "UNACON exclusiva de oncologia pediátrica",
    "1712": "CACON",
    "1713": "CACON com serviço de oncologia pediátrica",
    "1715": "Serviço de radioterapia de complexo hospitalar",
}

RADIOTHERAPY = {"1704", "1707", "1712", "1713", "1715"}
"""CACON includes radiotherapy; UNACON only does when explicitly habilitated."""


def clean_facilities(
    records: Iterable[Mapping[str, str]], names: Mapping[str, str], period: str,
) -> list[dict[str, Any]]:
    """Keep active CACON, UNACON and radiotherapy, once per facility and code."""
    facilities: dict[str, dict[str, Any]] = {}
    for row in records:
        code = row["SGRUPHAB"]
        if code not in HABILITATIONS:
            continue
        if row["COMPETEN"] != period:
            raise ValueError("CNES competence differs from the selected month")
        if not row["CMPT_INI"] <= period <= row["CMPT_FIM"]:
            continue
        cnes = row["CNES"]
        if not names.get(cnes):
            raise ValueError(f"CNES {cnes} has no facility name")
        facility = facilities.setdefault(cnes, {
            "cnes": cnes, "municipality": row["CODUFMUN"], "name": names[cnes],
            "habilitations": [],
        })
        if facility["municipality"] != row["CODUFMUN"]:
            raise ValueError(f"CNES {cnes} has conflicting municipalities")
        if code not in facility["habilitations"]:
            facility["habilitations"].append(code)
    for facility in facilities.values():
        facility["habilitations"].sort()
    return sorted(facilities.values(), key=lambda facility: facility["cnes"])


def nearby_facilities(
    facilities: list[dict[str, Any]], centers: Mapping[str, tuple[float, float]],
) -> dict[str, list[dict[str, Any]]]:
    """Three nearest oncology facilities plus three with radiotherapy, without duplicates.

    Distances are great-circle kilometres between municipal centroids, not routes.
    Ties use the CNES identifier for reproducible publication.
    """
    result = {}
    for code, (longitude, latitude) in centers.items():
        ranked = []
        for facility in facilities:
            target_lon, target_lat = centers[facility["municipality"]]
            angle = (sin(radians(target_lat - latitude) / 2) ** 2
                     + cos(radians(latitude)) * cos(radians(target_lat))
                     * sin(radians(target_lon - longitude) / 2) ** 2)
            distance = 6371.0088 * 2 * asin(sqrt(min(1.0, angle)))
            ranked.append((distance, facility["cnes"], facility))
        ranked.sort(key=lambda item: (item[0], item[1]))
        oncology = [item for item in ranked if set(item[2]["habilitations"]) - {"1704", "1715"}][:3]
        radio = [item for item in ranked if set(item[2]["habilitations"]) & RADIOTHERAPY][:3]
        chosen = {item[1] for item in oncology + radio}
        result[code] = [{"cnes": cnes, "distance_km": round(distance, 1)}
                        for distance, cnes, _ in ranked if cnes in chosen]
    return result


class CnesValidationError(ValueError):
    pass


class CnesSource:
    name = "cnes"

    def __init__(self, *, raw_dir: Path = RAW_DIR / "cnes",
                 clean_dir: Path = CLEAN_DIR / "cnes", site_data_dir: Path = SITE_DATA_DIR) -> None:
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir
        self._site_data_dir = site_data_dir

    def download(self) -> None:
        """Select the latest common month for every UF; never mix competences."""
        available: dict[tuple[str, str], set[str]] = {}
        for kind in ("HB", "ST"):
            for name in list_ftp(f"{FTP_ROOT}Dados/{kind}/"):
                match = re.fullmatch(rf"{kind}([A-Z]{{2}})(\d{{4}})\.dbc", name, re.IGNORECASE)
                if match and match[1].upper() in UF_COUNT_RANGES:
                    available.setdefault((kind, match[1].upper()), set()).add(match[2])
        groups = [available.get((kind, uf), set()) for kind in ("HB", "ST") for uf in UF_COUNT_RANGES]
        common = set.intersection(*groups)
        if not common:
            raise CnesValidationError("no common CNES month for all 27 states")
        month = max(common)
        for kind in ("HB", "ST"):
            for uf in sorted(UF_COUNT_RANGES):
                name = f"{kind}{uf}{month}.dbc"
                fetch(f"{FTP_ROOT}Dados/{kind}/{name}", self._raw_dir / name)
        fetch(f"{FTP_ROOT}Auxiliar/TAB_CNES.zip", self._raw_dir / "TAB_CNES.zip")
        self._raw_dir.mkdir(parents=True, exist_ok=True)
        (self._raw_dir / "extract.json").write_text(json.dumps({
            "period": "20" + month, "extracted_at": datetime.now(timezone.utc).isoformat(),
            "files": [f"{kind}{uf}{month}.dbc" for kind in ("HB", "ST") for uf in sorted(UF_COUNT_RANGES)],
            "names_file": "TAB_CNES.zip",
        }))

    def clean(self) -> None:
        extract = json.loads((self._raw_dir / "extract.json").read_text())
        period = extract["period"]
        names = _facility_names(self._raw_dir / "TAB_CNES.zip")
        facilities = clean_facilities(
            (row for name in extract["files"] if name.startswith("HB")
             for row in _dbc_records(self._raw_dir / name)), names, period,
        )
        wanted = {facility["cnes"]: facility for facility in facilities}
        found = set()
        for name in extract["files"]:
            if not name.startswith("ST"):
                continue
            for row in _dbc_records(self._raw_dir / name):
                if row["CNES"] in wanted:
                    facility = wanted[row["CNES"]]
                    if row["COMPETEN"] != period or row["CODUFMUN"] != facility["municipality"]:
                        raise CnesValidationError(f"inconsistent ST record for {row['CNES']}")
                    found.add(row["CNES"])
        if found != wanted.keys():
            raise CnesValidationError("habilitated facilities missing from ST")
        self._clean_dir.mkdir(parents=True, exist_ok=True)
        with duckdb.connect() as db:
            db.execute("CREATE TABLE facilities (cnes VARCHAR, municipality VARCHAR, name VARCHAR, habilitations VARCHAR[])")
            if facilities:
                db.executemany("INSERT INTO facilities VALUES (?, ?, ?, ?)", [
                    (f["cnes"], f["municipality"], f["name"], f["habilitations"]) for f in facilities
                ])
            db.execute("COPY facilities TO ? (FORMAT PARQUET)", [str(self._clean_dir / "facilities.parquet")])
        (self._clean_dir / "extract.json").write_text(json.dumps(extract))

    def compute(self) -> None:
        """Use municipal geometry instead of unreliable establishment coordinates."""
        centers_path = self._clean_dir / "centers.geojson"
        subprocess.run([str(MAPSHAPER), "-i", str(self._site_data_dir / "municipalities.topojson"),
                        "-points", "centroid", "-o", str(centers_path), "format=geojson", "force"],
                       check=True, capture_output=True, text=True)
        features = json.loads(centers_path.read_text())["features"]
        centers = {f["properties"]["CD_MUN"]: tuple(f["geometry"]["coordinates"]) for f in features}
        nearby = nearby_facilities(self._facilities(), centers)
        (self._clean_dir / "nearby.json").write_text(json.dumps(nearby))

    def validate(self) -> None:
        listing = json.loads((self._site_data_dir / "municipalities.json").read_text())
        municipalities = {m["code"]: m for m in listing["municipalities"]}
        counts = dict.fromkeys(UF_COUNT_RANGES, 0)
        facilities = self._facilities()
        for facility in facilities:
            if facility["municipality"] not in municipalities:
                raise CnesValidationError(f"unknown municipality for CNES {facility['cnes']}")
            counts[municipalities[facility["municipality"]]["uf"]] += len(facility["habilitations"])
        problems = [f"{uf}: {counts[uf]} habilitations outside {low}–{high}"
                    for uf, (low, high) in UF_COUNT_RANGES.items() if not low <= counts[uf] <= high]
        if problems:
            raise CnesValidationError("; ".join(problems))
        nearby = json.loads((self._clean_dir / "nearby.json").read_text())
        if nearby.keys() != municipalities.keys():
            raise CnesValidationError("nearby services do not cover every municipality")
        known = {f["cnes"] for f in facilities}
        for code, entries in nearby.items():
            if not entries or len({e["cnes"] for e in entries}) != len(entries):
                raise CnesValidationError(f"missing or duplicate nearby services for {code}")
            if any(e["cnes"] not in known or not 0 <= e["distance_km"] <= 20040 for e in entries):
                raise CnesValidationError(f"invalid nearby service for {code}")

    def export(self) -> None:
        """Validate again even for --step export; preserve other sources' profile entries."""
        self.validate()
        extract = json.loads((self._clean_dir / "extract.json").read_text())
        listing = json.loads((self._site_data_dir / "municipalities.json").read_text())
        municipalities = {m["code"]: m for m in listing["municipalities"]}
        nearby = json.loads((self._clean_dir / "nearby.json").read_text())
        facilities = {}
        for facility in self._facilities():
            municipality = municipalities[facility["municipality"]]
            facilities[facility["cnes"]] = {**facility, "municipality_name": municipality["name"],
                "uf": municipality["uf"], "habilitations": [
                    {"code": code, "label": HABILITATIONS[code]} for code in facility["habilitations"]]}
        files: dict[str, object] = {}
        for uf in sorted(UF_COUNT_RANGES):
            name = f"profiles/{uf}.json"
            path = self._site_data_dir / name
            profile = json.loads(path.read_text()) if path.exists() else {"uf": uf, "indicators": {}}
            local = {code: entries for code, entries in nearby.items() if municipalities[code]["uf"] == uf}
            ids = {entry["cnes"] for entries in local.values() for entry in entries}
            profile["where_to_treat"] = {"period": extract["period"], "source": SOURCE,
                "extracted_at": extract["extracted_at"], "municipalities": local,
                "facilities": {cnes: facilities[cnes] for cnes in sorted(ids)}}
            files[name] = profile
        files[MANIFEST] = updated_manifest(self._site_data_dir, source=self.name,
            extract={"name": SOURCE["name"], **extract}, indicators={"where_to_treat": {"period": extract["period"]}})
        publish_together(self._site_data_dir, files)

    def _facilities(self) -> list[dict[str, Any]]:
        with duckdb.connect() as db:
            rows = db.execute("SELECT * FROM read_parquet(?) ORDER BY cnes",
                              [str(self._clean_dir / "facilities.parquet")]).fetchall()
        return [dict(zip(("cnes", "municipality", "name", "habilitations"), row)) for row in rows]


def _dbc_records(path: Path) -> Iterable[dict[str, str]]:
    with tempfile.TemporaryDirectory() as workdir:
        dbf = Path(workdir) / "data.dbf"
        datasus_dbc.decompress(str(path), str(dbf))
        # Some CNES DBCs decompress with a NUL instead of the DBF header terminator.
        with dbf.open("r+b") as file:
            header = file.read(32)
            length = struct.unpack_from("<H", header, 8)[0]
            file.seek(length - 1)
            if file.read(1) == b"\x00":
                file.seek(length - 1)
                file.write(b"\r")
        for row in dbfread.DBF(str(dbf), encoding="latin-1"):
            yield {key: str(value).strip() if value is not None else "" for key, value in row.items()}


def _facility_names(path: Path) -> dict[str, str]:
    with tempfile.TemporaryDirectory() as workdir, zipfile.ZipFile(path) as archive:
        member = next(name for name in archive.namelist() if Path(name).name.upper() == "CADGERBR.DBF")
        archive.extract(member, workdir)
        return {str(row["CNES"]): str(row["FANTASIA"]).strip()
                for row in dbfread.DBF(str(Path(workdir) / member), encoding="latin-1")}
