"""Resume the initial SIM load using the annual extracts preserved in November 2026."""

import json
import sys
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))

import duckdb

import pipeline.sources.sim as sim
from pipeline.download import FtpTransport


def main() -> None:
    raw = ROOT / 'data/raw/sim'
    annual = ROOT / 'data/clean/sim-annual-check'
    clean = ROOT / 'data/clean/sim'
    years = sim.YEARS
    previous = {year: ((raw / f'DOBR{year}.dbc').stat().st_size,
                       (raw / f'DOBR{year}.dbc').stat().st_mtime)
                for year in years if (raw / f'DOBR{year}.dbc').exists()}
    source = sim.SimSource(transport=FtpTransport(timeout=30, workers=4))
    source.download()
    try:
        for year in years:
            path = raw / f'DOBR{year}.dbc'
            unchanged = previous.get(year) == (path.stat().st_size, path.stat().st_mtime)
            if unchanged and (annual / str(year) / 'deaths.parquet').exists():
                continue
            sim.YEARS = (year,)
            sim.SimSource(clean_dir=annual / str(year)).clean()
            print(f'SIM {year} cleaned', flush=True)
    finally:
        sim.YEARS = years
    clean.mkdir(parents=True, exist_ok=True)
    destination = clean / 'deaths.parquet'
    partial = destination.with_suffix('.parquet.part')
    with duckdb.connect() as db:
        db.execute('COPY (SELECT * FROM read_parquet(?)) TO ? (FORMAT PARQUET)',
                   [[str(annual / str(year) / 'deaths.parquet') for year in years], str(partial)])
    partial.replace(destination)
    (clean / 'extract.json').write_text(json.dumps({
        'extracted_at': datetime.now(UTC).date().isoformat(),
        'files': [f'DOBR{year}.dbc' for year in years]}))
    source.compute()
    source.validate()
    source.export()
    print('SIM validated and exported', flush=True)


if __name__ == '__main__':
    main()
