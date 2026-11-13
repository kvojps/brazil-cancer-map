"""Persist the existing clean counts and calculated intermediate formats."""

import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any

import duckdb

from .models import (CANCER_TYPES, CountKey, CaseCounts, MonthKey, FirstTreatment, CleanRow, provisional_years)
from .calculation import PainelResult


def write_clean(
    clean_dir: Path,
    counts: Mapping[CountKey, CaseCounts],
    months: Mapping[MonthKey, int],
    *,
    extracted_at: str,
) -> None:
    """Write the standardized counts as Parquet, marking the provisional years, and the
    national monthly counts by first treatment."""
    provisional = provisional_years(year for year, _, _ in counts)
    clean_dir.mkdir(parents=True, exist_ok=True)
    with duckdb.connect() as db:
        db.execute(
            "CREATE TABLE cases (year INTEGER, municipality VARCHAR, cancer_type VARCHAR,"
            " provisional BOOLEAN, cases INTEGER, within_60_days INTEGER, without_treatment_info INTEGER,"
            " chemo_radio INTEGER, chemo_radio_within_60_days INTEGER)"
        )
        db.executemany(
            "INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    year, code, cancer_type, year in provisional, c.cases, c.within_60_days,
                    c.without_treatment_info, c.chemo_radio, c.chemo_radio_within_60_days,
                )
                for (year, code, cancer_type), c in sorted(counts.items())
            ],
        )
        db.execute(f"COPY cases TO '{clean_dir / 'cases.parquet'}' (FORMAT parquet)")
        db.execute("CREATE TABLE months (month VARCHAR, first_treatment VARCHAR, cases INTEGER)")
        db.executemany(
            "INSERT INTO months VALUES (?, ?, ?)",
            [(month, treatment.value, n) for (month, treatment), n in sorted(months.items())],
        )
        db.execute(f"COPY months TO '{clean_dir / 'months.parquet'}' (FORMAT parquet)")
    (clean_dir / "extract.json").write_text(json.dumps({"extracted_at": extracted_at}))


def read_clean(clean_dir: Path) -> list[CleanRow]:
    with duckdb.connect() as db:
        rows = db.execute(
            "SELECT year, municipality, cancer_type, provisional, cases, within_60_days,"
            " without_treatment_info, chemo_radio, chemo_radio_within_60_days FROM read_parquet(?)",
            [str(clean_dir / "cases.parquet")],
        ).fetchall()
    return [CleanRow(*row) for row in rows]


def read_months(clean_dir: Path) -> dict[MonthKey, int]:
    with duckdb.connect() as db:
        rows = db.execute(
            "SELECT month, first_treatment, cases FROM read_parquet(?)", [str(clean_dir / "months.parquet")]
        ).fetchall()
    return {(month, FirstTreatment(treatment)): n for month, treatment, n in rows}


def write_result(clean_dir: Path, result: PainelResult) -> None:
    (clean_dir / "monthly_alerts.json").write_text(json.dumps(result.monthly_alerts))
    layers = clean_dir / "layers"
    layers.mkdir(parents=True, exist_ok=True)
    for cancer_type, layer in result.layers.items():
        (layers / f"{cancer_type}.json").write_text(json.dumps(layer))
        (layers / f"{cancer_type}-profiles.json").write_text(json.dumps(result.profiles[cancer_type]))


def read_layers(clean_dir: Path) -> dict[str, dict[str, Any]]:
    return {
        kind: json.loads((clean_dir / "layers" / f"{kind}.json").read_text())
        for kind in CANCER_TYPES
    }


def read_result(clean_dir: Path) -> PainelResult:
    layers = clean_dir / "layers"
    return PainelResult(
        read_layers(clean_dir),
        {kind: json.loads((layers / f"{kind}-profiles.json").read_text()) for kind in CANCER_TYPES},
        json.loads((clean_dir / "monthly_alerts.json").read_text()),
    )
