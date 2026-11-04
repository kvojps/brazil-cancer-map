"""SIM mortality by residence and underlying cause, directly standardized by age."""

import json
import math
import tempfile
from collections import defaultdict
from collections.abc import Iterator
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import datasus_dbc
import dbfread
import duckdb

from pipeline.cascade import Origin, data_origins
from pipeline.download import FtpTransport, Transport, fetch
from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.population import Population
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.trend import quasi_poisson_trend

YEARS = tuple(range(2014, 2025))
WEIGHTS = dict(zip(range(0, 81, 5), (12000, 10000, 9000, 9000, 8000, 8000, 6000,
    6000, 6000, 6000, 5000, 4000, 4000, 3000, 2000, 1000, 1000), strict=True))
CANCERS = {'all': None, 'breast': 2, 'cervix': 2, 'prostate': 1, 'lung': None, 'colorectal': None}
CODES = {'breast': {'C50'}, 'cervix': {'C53'}, 'prostate': {'C61'},
         'lung': {'C33', 'C34'}, 'colorectal': {'C18', 'C19', 'C20', 'C21'}}
FTP_ROOT = 'ftp://ftp.datasus.gov.br/dissemin/publicos/SIM/CID10/DORES/'
SOURCE = {'name': 'SIM (DATASUS/Ministério da Saúde)', 'url': FTP_ROOT,
          'conditions': 'Dados abertos do Ministério da Saúde; reutilização com citação da fonte.',
          'period': 'Óbitos por residência e causa básica, 2014–2024, sem anos preliminares.'}
REFERENCE_PATH = Path(__file__).parent.parent / 'references' / 'sim-atlas.json'


def read_records(path: Path) -> Iterator[dict[str, str]]:
    with tempfile.TemporaryDirectory() as workdir:
        dbf = Path(workdir) / 'deaths.dbf'
        datasus_dbc.decompress(str(path), str(dbf))
        for row in dbfread.DBF(str(dbf), encoding='latin-1', char_decode_errors='replace'):
            yield {key: str(row.get(key) or '').strip() for key in
                   ('CODMUNRES', 'CAUSABAS', 'SEXO', 'IDADE', 'DTOBITO', 'TIPOBITO')}


class SimSource:
    name = 'sim'

    def __init__(self, *, raw_dir: Path = RAW_DIR / 'sim', clean_dir: Path = CLEAN_DIR / 'sim',
                 site_data_dir: Path = SITE_DATA_DIR,
                 population_path: Path = CLEAN_DIR / 'popsvs' / 'population.parquet',
                 reference_path: Path = REFERENCE_PATH, transport: Transport | None = None) -> None:
        self._raw_dir, self._clean_dir, self._site_data_dir = raw_dir, clean_dir, site_data_dir
        self._population_path, self._reference_path = population_path, reference_path
        self._transport = transport or FtpTransport(timeout=120, workers=8)

    def download(self) -> None:
        for year in YEARS:
            name = f'DOBR{year}.dbc'
            fetch(FTP_ROOT + name, self._raw_dir / name, transport=self._transport)

    def clean(self) -> None:
        counts: dict[tuple[int, str, str, int], int] = defaultdict(int)
        for year in YEARS:
            path = self._raw_dir / f'DOBR{year}.dbc'
            for row in read_records(path):
                if row['TIPOBITO'] != '2':
                    continue
                if row['DTOBITO'][-4:] != str(year):
                    raise ValueError(f'{path.name}: unexpected death year')
                code, cause, sex = row['CODMUNRES'], row['CAUSABAS'][:3], row['SEXO']
                if len(code) != 6 or not code.isdigit():
                    continue
                age = row['IDADE']
                group = -1
                if len(age) == 3 and age.isdigit():
                    if age[0] in '0123':
                        group = 0
                    elif age[0] == '4':
                        group = min(int(age[1:]) // 5 * 5, 80)
                    elif age[0] == '5':
                        group = 80
                for cancer, selected_sex in CANCERS.items():
                    included = ('C00' <= cause <= 'C97' and cause != 'C44') if cancer == 'all' else cause in CODES[cancer]
                    if included and (selected_sex is None or sex == str(selected_sex)):
                        counts[year, code, cancer, group] += 1
        self._clean_dir.mkdir(parents=True, exist_ok=True)
        with duckdb.connect() as db:
            db.execute('CREATE TABLE deaths(year INTEGER, municipality VARCHAR, cancer_type VARCHAR, age_group INTEGER, deaths BIGINT)')
            db.executemany('INSERT INTO deaths VALUES (?, ?, ?, ?, ?)', [(*key, value) for key, value in counts.items()])
            db.execute('COPY deaths TO ? (FORMAT PARQUET)', [str(self._clean_dir / 'deaths.parquet')])
        (self._clean_dir / 'extract.json').write_text(json.dumps({
            'extracted_at': datetime.now(UTC).date().isoformat(), 'files': [f'DOBR{y}.dbc' for y in YEARS]}))

    def compute(self) -> None:
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        regions = {m['code']: m['immediate_region'] for m in listing['municipalities']}
        with duckdb.connect() as db:
            rows = db.execute('SELECT * FROM read_parquet(?)', [str(self._clean_dir / 'deaths.parquet')]).fetchall()
        population = Population(self._population_path)
        computed: dict[str, Any] = {}
        validation: dict[str, Any] = {}
        for cancer, sex in CANCERS.items():
            # Aggregate deaths and denominators before standardizing, including for regional fallback.
            deaths: dict[tuple[str, int, int], int] = defaultdict(int)
            denominators: dict[tuple[str, int, int], int] = defaultdict(int)
            totals: dict[tuple[str, int], int] = defaultdict(int)
            for year, code, kind, age, n in rows:
                if kind != cancer:
                    continue
                keys = ['BR', f'uf:{code[:2]}']
                if code in regions:
                    keys += [f'municipality:{code}', f'immediate_region:{regions[code]}']
                for key in keys:
                    deaths[key, year, age] += n
                    totals[key, year] += n
            provisional: set[int] = set()
            for age in WEIGHTS:
                values = population.get_many(regions.keys(), YEARS, sex=sex, min_age=age,
                                             max_age=min(age + 4, 80))
                for (code, year), result in values.items():
                    if result.population <= 0:
                        raise ValueError(f'SIM: nonpositive population for {code}/{year}/{age}')
                    if result.provisional:
                        provisional.add(year)
                    for key in ('BR', f'uf:{code[:2]}', f'municipality:{code}', f'immediate_region:{regions[code]}'):
                        denominators[key, year, age] += result.population
            years = [year for year in YEARS[-10:] if year not in provisional]
            origins = data_origins({code: sum(totals[f'municipality:{code}', y] for y in years)
                                    for code in regions}, regions, years=len(years))
            all_keys = {key for key, _, _ in denominators}
            series: dict[str, list[dict[str, Any]]] = {}
            trends: dict[str, str | None] = {}
            for key in all_keys:
                points = []
                events, exposures, fitted_years = [], [], []
                for year in YEARS:
                    cells = [denominators[key, year, age] for age in WEIGHTS]
                    if not all(cells):
                        if totals[key, year]:
                            raise ValueError(f'SIM: deaths without population for {key}/{year}')
                        continue
                    rate = sum(WEIGHTS[age] * deaths[key, year, age] / denominators[key, year, age]
                               for age in WEIGHTS)
                    total_population = sum(cells)
                    points.append({'year': year, 'value': rate, 'provisional': year in provisional,
                                   'without_treatment_info': None})
                    # Standardized deaths retain the rate with a population offset.
                    events.append(rate * total_population / 100000)
                    exposures.append(total_population)
                    fitted_years.append(year)
                    if key == 'BR' or key.startswith('uf:'):
                        validation[f'{cancer}/{key}/{year}'] = {'deaths': totals[key, year], 'rate': rate}
                fit = quasi_poisson_trend(fitted_years, events, exposures, higher_is_better=False, provisional=provisional)
                series[key] = points
                trends[key] = fit.trend_class.value if fit else None
            entries = {}
            for code, origin in origins.items():
                series_key = (f'municipality:{code}' if origin is Origin.MUNICIPALITY else
                       f'immediate_region:{regions[code]}' if origin is Origin.IMMEDIATE_REGION else None)
                points = series[series_key] if series_key else []
                entries[code] = {'origin': origin.value, 'value': next((p['value'] for p in reversed(points)
                    if not p['provisional']), None), 'trend': trends[series_key] if series_key else None,
                    'status': None, 'status_note': None, 'quality_band': None,
                    'without_treatment_info': None, 'series_id': series_key}
            consolidated = [y for y in YEARS if y not in provisional]
            computed[cancer] = {'period': {'first_year': 2014, 'last_year': 2024,
                'latest': consolidated[-1], 'trend': [years[0], years[-1]], 'provisional': sorted(provisional)},
                'municipalities': entries, 'series': series, 'national_trend': trends['BR']}
        (self._clean_dir / 'computed.json').write_text(json.dumps(computed, allow_nan=False))
        (self._clean_dir / 'validation.json').write_text(json.dumps(validation, allow_nan=False))

    def validate(self) -> None:
        reference = json.loads(self._reference_path.read_text())
        checks = reference['checks']
        if not checks or not reference['source'].startswith('https://'):
            raise ValueError('SIM requires documented Atlas reference checks')
        validation = json.loads((self._clean_dir / 'validation.json').read_text())
        for check in checks:
            value = validation[f"{check['cancer_type']}/{check['area']}/{check['year']}"]
            if value['deaths'] != check['deaths'] or not math.isclose(value['rate'], check['rate'], rel_tol=0.03):
                raise ValueError(f'SIM differs from Atlas: {check}')
        computed = json.loads((self._clean_dir / 'computed.json').read_text())
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        codes = {m['code'] for m in listing['municipalities']}
        if set(computed) != set(CANCERS):
            raise ValueError('SIM missing cancer types')
        for data in computed.values():
            if set(data['municipalities']) != codes:
                raise ValueError('SIM missing mesh municipalities')
            for points in data['series'].values():
                if any(not math.isfinite(p['value']) or not 0 <= p['value'] <= 10000 for p in points):
                    raise ValueError('SIM rate outside plausible range')

    def export(self) -> None:
        self.validate()
        computed = json.loads((self._clean_dir / 'computed.json').read_text())
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        files: dict[str, Any] = {}
        for cancer, data in computed.items():
            files[f'map/mortality/{cancer}.json'] = {'indicator': 'mortality', 'cancer_type': cancer,
                'source': SOURCE, 'has_status': False, 'reference': None, 'period': data['period'],
                'municipalities': {code: {k: v for k, v in entry.items() if k != 'series_id'}
                                   for code, entry in data['municipalities'].items()}}
        for uf in {m['uf'] for m in listing['municipalities']}:
            name = f'profiles/{uf}.json'
            path = self._site_data_dir / name
            profile = json.loads(path.read_text()) if path.exists() else {'uf': uf, 'indicators': {}}
            profile['indicators']['mortality'] = {}
            codes = {m['code'] for m in listing['municipalities'] if m['uf'] == uf}
            for cancer, data in computed.items():
                entries = {code: data['municipalities'][code] for code in sorted(codes)}
                keys = {e['series_id'] for e in entries.values()} - {None}
                profile['indicators']['mortality'][cancer] = {'source': SOURCE, 'has_status': False,
                    'reference': None, 'period': data['period'], 'national_trend': data['national_trend'],
                    'municipalities': entries, 'series': {key: data['series'][key] for key in sorted(keys)}}
            files[name] = profile
        files[MANIFEST] = updated_manifest(self._site_data_dir, source=self.name,
            extract={'name': SOURCE['name'], **json.loads((self._clean_dir / 'extract.json').read_text())},
            indicators={'mortality': {cancer: data['period'] for cancer, data in computed.items()}})
        publish_together(self._site_data_dir, files)
