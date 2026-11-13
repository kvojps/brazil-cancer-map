"""Load official inputs and preserve the computed.json intermediate."""

from dataclasses import asdict
import json
from pathlib import Path
from typing import Any

import duckdb

from pipeline.sources.hpv.models import CensusRow, HpvResult


def read_official(clean_dir: Path) -> dict[str, Any]:
    data: dict[str, Any] = json.loads((clean_dir / 'official.json').read_text())
    return data


def read_census(clean_dir: Path) -> list[CensusRow]:
    with duckdb.connect() as db:
        rows = db.execute('SELECT municipality, sex, age, population FROM read_parquet(?)',
                          [str(clean_dir / 'census.parquet')]).fetchall()
    return [CensusRow(*row) for row in rows]


def write_result(clean_dir: Path, result: HpvResult) -> None:
    clean_dir.mkdir(parents=True, exist_ok=True)
    (clean_dir / 'computed.json').write_text(json.dumps(asdict(result), allow_nan=False))


def read_result(clean_dir: Path) -> HpvResult:
    data = json.loads((clean_dir / 'computed.json').read_text())
    return HpvResult(**data)
