"""Extract harmonized Vigitel interviews and publish smoking by state capital."""

import csv
import io
import hashlib
import json
import math
import os
import zipfile
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import duckdb
from scipy import stats

from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.sources.inca import CAPITALS
from pipeline.status import classify_status
from pipeline.trend import weighted_prevalence_trend

CITY_UFS = 'SE PA MG RR MS MT PR SC CE GO PB AP AL AM RN TO RS RO PE AC RJ BA MA SP PI ES DF'.split()
REFERENCE = Path(__file__).resolve().parents[1] / 'references' / 'vigitel.json'
SOURCE = {'name': 'Vigitel — Ministério da Saúde',
          'url': 'https://svs.aids.gov.br/daent/cgdnt/vigitel/',
          'conditions': 'Dados públicos; reutilização com citação da fonte.'}


class VigitelSource:
    name = 'vigitel'

    def __init__(self, *, input_path: Path | None = None,
                 clean_dir: Path = CLEAN_DIR / 'vigitel',
                 site_data_dir: Path = SITE_DATA_DIR,
                 reference_path: Path = REFERENCE) -> None:
        self._input = input_path or Path(os.environ.get('VIGITEL_INPUT_PATH', RAW_DIR / 'vigitel' / 'microdata.zip'))
        self._clean = clean_dir
        self._site = site_data_dir
        self._reference = reference_path

    def download(self) -> None:
        """Use the manually downloaded archive; its changing name is configurable."""
        if not self._input.is_file():
            raise ValueError('Run ./download-vigitel.sh or set VIGITEL_INPUT_PATH to the harmonized CSV/ZIP')

    def clean(self) -> None:
        """Stream only the documented fields to Parquet; reject incompatible editions."""
        self._clean.mkdir(parents=True, exist_ok=True)
        reduced = self._clean / 'interviews.csv.part'
        try:
            with reduced.open('w', newline='') as output:
                writer = csv.writer(output)
                writer.writerow(['year', 'city', 'smoker', 'weight'])
                if self._input.suffix.lower() == '.zip':
                    with zipfile.ZipFile(self._input) as archive:
                        members = [m for m in archive.namelist() if m.lower().endswith('.csv')]
                        if len(members) != 1:
                            raise ValueError('Vigitel archive must contain exactly one CSV')
                        with archive.open(members[0]) as member:
                            self._extract(io.TextIOWrapper(member, encoding='latin1'), writer)
                else:
                    with self._input.open(encoding='latin1', newline='') as member:
                        self._extract(member, writer)
            with duckdb.connect() as db:
                db.execute('COPY (SELECT * FROM read_csv(?, header=true)) TO ? (FORMAT PARQUET)',
                           [str(reduced), str(self._clean / 'interviews.parquet')])
            with self._input.open('rb') as raw:
                checksum = hashlib.file_digest(raw, 'sha256').hexdigest()
            (self._clean / 'extraction.json').write_text(json.dumps({
                'extracted_at': datetime.now(UTC).date().isoformat(), 'input_file': self._input.name, 'input_sha256': checksum,
                'weight': 'pesorake2025', 'indicator': 'fumante', 'source': SOURCE}))
        finally:
            reduced.unlink(missing_ok=True)

    @staticmethod
    def _extract(member: Any, writer: Any) -> None:
        rows = csv.DictReader(member)
        if not {'ano', 'cidade', 'q6', 'fumante', 'pesorake2025'} <= set(rows.fieldnames or []):
            raise ValueError('Vigitel requires harmonized ano/cidade/q6/fumante/pesorake2025 columns')
        for row in rows:
            year, city = int(row['ano']), int(row['cidade'])
            smoker, weight = float(row['fumante']), float(row['pesorake2025'])
            if (not 2006 <= year <= datetime.now(UTC).year or not 1 <= city <= 27
                    or float(row['q6']) < 18 or smoker not in (0, 1)
                    or not math.isfinite(weight) or weight <= 0):
                raise ValueError('Invalid Vigitel interview; never silently discard survey weights')
            writer.writerow([year, city, smoker, weight])

    def compute(self) -> None:
        """Survey mean with Taylor linearization, matching svyset [pweight=pesorake2025]."""
        with duckdb.connect() as db:
            db.execute('CREATE TABLE interviews AS SELECT * FROM read_parquet(?)',
                       [str(self._clean / 'interviews.parquet')])
            total = db.execute('SELECT count(*) FROM interviews').fetchone()
            assert total is not None
            count = total[0]
            if count < 2:
                raise ValueError('Vigitel requires at least two interviews')
            rows = db.execute('''WITH means AS (
                SELECT year, city, sum(weight*smoker)/sum(weight) AS p, sum(weight) AS w
                FROM interviews GROUP BY ALL)
                SELECT m.year, m.city, m.p,
                    sum(pow(i.weight*(i.smoker-m.p),2))/pow(m.w,2) AS variance,
                    count(*) AS sample_size
                FROM means m JOIN interviews i USING(year,city) GROUP BY m.year,m.city,m.p,m.w ORDER BY m.year,m.city''').fetchall()
            national = {str(year): value for year, value in db.execute('''
                SELECT year, 100*sum(weight*smoker)/sum(weight) FROM interviews GROUP BY year''').fetchall()}
        (self._clean / 'validation.json').write_text(json.dumps(national, allow_nan=False))
        critical = float(stats.t.ppf(0.975, count - 1))
        states: dict[str, list[dict[str, Any]]] = {}
        for year, city, p, variance, sample_size in rows:
            se = 100 * math.sqrt(variance * count / (count - 1))
            value = 100 * p
            states.setdefault(CITY_UFS[city - 1], []).append({
                'year': year, 'value': value, 'ci_low': value - critical * se,
                'ci_high': value + critical * se, 'standard_error': se,
                'sample_size': sample_size})
        result = {}
        for uf, series in states.items():
            latest = series[-1]
            trend = weighted_prevalence_trend([p['year'] for p in series],
                [p['value'] for p in series], [p['standard_error'] for p in series])
            result[uf] = {'capital_name': CAPITALS[uf], 'series': series,
                'value': latest['value'], 'ci_low': latest['ci_low'], 'ci_high': latest['ci_high'],
                'status': classify_status(latest['value'], reference=5.9, lower_is_better=True),
                'trend': asdict(trend) if trend else None,
                'reference': {'value': 5.9, 'label': 'meta do Brasil para 2030'},
                'period': {'first_year': series[0]['year'], 'last_year': latest['year'], 'latest': latest['year']},
                'source': SOURCE, **json.loads((self._clean / 'extraction.json').read_text())}
        (self._clean / 'computed.json').write_text(json.dumps(result, allow_nan=False))

    def validate(self) -> None:
        data = json.loads((self._clean / 'computed.json').read_text())
        reference = json.loads(self._reference.read_text())
        expected = reference.get('national_prevalence', {})
        actual = json.loads((self._clean / 'validation.json').read_text())
        if not reference.get('source_url') or not expected:
            raise ValueError('Missing official Vigitel reference')
        for year, value in expected.items():
            if year not in actual or not math.isclose(actual[year], value, rel_tol=0.03):
                raise ValueError(f'{year}: prevalence differs from official Vigitel reference by more than 3%')
        if set(data) != set(CAPITALS):
            raise ValueError('Vigitel must cover all 27 capitals')
        years = None
        for entry in data.values():
            observed = [p['year'] for p in entry['series']]
            if years is not None and years != observed:
                raise ValueError('Vigitel capitals must cover the same years')
            years = observed
            for point in entry['series']:
                if not (0 <= point['value'] <= 100 and point['sample_size'] >= 2
                        and point['ci_low'] <= point['value'] <= point['ci_high']):
                    raise ValueError('Invalid Vigitel prevalence or confidence interval')

    def export(self) -> None:
        self.validate()
        data = json.loads((self._clean / 'computed.json').read_text())
        files: dict[str, object] = {}
        for uf, entry in data.items():
            path = self._site / 'profiles' / f'{uf}.json'
            profile = json.loads(path.read_text()) if path.exists() else {'uf': uf, 'indicators': {}}
            profile['indicators']['smoking'] = {kind: entry for kind in ('all', 'lung')}
            files[f'profiles/{uf}.json'] = profile
        extract = json.loads((self._clean / 'extraction.json').read_text())
        period = next(iter(data.values()))['period']
        files[MANIFEST] = updated_manifest(self._site, source=self.name, extract=extract,
            indicators={'smoking': {kind: period for kind in ('all', 'lung')}})
        publish_together(self._site, files)
