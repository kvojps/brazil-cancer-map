"""SISCAN screening mammograms by municipality of residence."""

import json
import re
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import duckdb

from pipeline.cascade import Origin, data_origins
from pipeline.download import Transport, fetch, transport_for, with_retries
from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.status import classify_status, status_note
from pipeline.trend import quasi_poisson_trend

FILE_NAME = re.compile(r'SISCAN_MAMOGRAFIA_(201[6-9]|202[0-5])\.csv', re.IGNORECASE)
YEARS = tuple(range(2016, 2026))
FTP_ROOT = 'ftp://ftp.datasus.gov.br/dissemin/publicos/SISCAN/SISCAN/'
SOURCE = {
    'name': 'SISCAN (DATASUS/Ministério da Saúde)', 'url': FTP_ROOT,
    'conditions': 'Dados abertos do Ministério da Saúde; reutilização com citação da fonte.',
    'period': 'Mamografias de rastreamento em mulheres de 50–69 anos, 2016–2025, por residência.',
}
ABOVE_EXPECTED = 2
MAXIMUM_RATIO = 10
"""Operational checks: flag ratios above two; block publication above ten (never clamp)."""

type Series = dict[int, tuple[int, float]]
"""Year → (screening examinations, women aged 50–69 divided by two)."""


def mammography_result(series: Series, provisional: set[int]) -> dict[str, Any]:
    years = sorted(series)
    consolidated = [year for year in YEARS if year not in provisional]
    latest = consolidated[-1]
    events, exposure = zip(*(series[year] for year in years), strict=True) if years else ((), ())
    trend = quasi_poisson_trend(years, events, exposure, higher_is_better=True, provisional=provisional)
    numerator, denominator = series.get(latest, (0, 0))
    value = numerator / denominator if denominator else None
    return {
        'value': value, 'trend': trend.trend_class.value if trend else None,
        'trend_estimate': asdict(trend) if trend else None,
        'status': classify_status(value, reference=1), 'status_note': status_note(value, maximum=ABOVE_EXPECTED),
        'quality_band': None, 'without_treatment_info': None,
    }


def mammography_data(series: dict[str, Series], regions: dict[str, str],
                     provisional: set[int]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Compute the map and profile together so the numerator cascade governs the entire card."""
    consolidated = [year for year in YEARS if year not in provisional]
    origins = data_origins({code: sum(n for year, (n, _) in points.items() if year in consolidated)
                            for code, points in series.items()}, regions, years=len(consolidated))
    grouped = {f'municipality:{code}': points for code, points in series.items()}
    for code, points in series.items():
        for key in (f'immediate_region:{regions[code]}', f'uf:{code[:2]}'):
            target = grouped.setdefault(key, {})
            for year, (n, d) in points.items():
                previous_n, previous_d = target.get(year, (0, 0))
                target[year] = previous_n + n, previous_d + d
    shown = {}
    profiles = {}
    displayed_series = {}
    results = {}
    for code, origin in origins.items():
        series_key: str | None = (f'municipality:{code}' if origin is Origin.MUNICIPALITY else
               f'immediate_region:{regions[code]}' if origin is Origin.IMMEDIATE_REGION else None)
        if series_key is not None and series_key not in results:
            results[series_key] = mammography_result(grouped[series_key], provisional)
            displayed_series[series_key] = [
                {'year': year, 'value': n / d if d else None, 'provisional': year in provisional,
                 'without_treatment_info': None}
                for year, (n, d) in sorted(grouped[series_key].items())]
        entry = {'origin': origin.value, **(results[series_key] if series_key else mammography_result({}, provisional))}
        shown[code] = entry
        profiles[code] = {**entry, 'series_id': series_key}
    period = {'first_year': 2016, 'last_year': 2025, 'latest': consolidated[-1],
              'trend': [consolidated[0], consolidated[-1]], 'provisional': sorted(provisional)}
    layer = {'period': period, 'reference': {'value': 1, 'label': 'meta'}, 'municipalities': shown}
    profile = {'municipalities': profiles, 'series': displayed_series,
               'uf_trends': {uf: mammography_result(grouped[f'uf:{uf}'], provisional)['trend']
                             for uf in {code[:2] for code in regions}}}
    return layer, profile


class SiscanSource:
    name = 'siscan'

    def __init__(self, *, raw_dir: Path = RAW_DIR / 'siscan',
                 clean_dir: Path = CLEAN_DIR / 'siscan', site_data_dir: Path = SITE_DATA_DIR,
                 population_path: Path = CLEAN_DIR / 'popsvs' / 'population.parquet',
                 transport: Transport | None = None) -> None:
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir
        self._site_data_dir = site_data_dir
        self._population_path = population_path
        self._transport = transport or transport_for(FTP_ROOT)

    def download(self) -> None:
        """Download and reduce one file at a time, keeping at most one raw CSV on disk."""
        for year in YEARS:
            path = self._raw_dir / f'SISCAN_MAMOGRAFIA_{year}.csv'
            url = FTP_ROOT + path.name
            remote = with_retries(lambda: self._transport.head(url), f'inspect {path.name}')
            metadata_path = self._clean_dir / 'exams' / f'{year}.json'
            if metadata_path.exists() and metadata_path.with_suffix('.parquet').exists():
                previous = json.loads(metadata_path.read_text())
                if (remote.size is not None and remote.modified is not None
                        and previous.get('size') == remote.size and previous.get('modified') == remote.modified):
                    continue
            fetch(url, path, transport=self._transport)
            self._clean_file(path, year)

    def clean(self) -> None:
        """Reduce each CSV with DuckDB before deleting it; never retain the full collection."""
        for path in sorted(self._raw_dir.glob('*.csv')):
            if match := FILE_NAME.fullmatch(path.name):
                self._clean_file(path, int(match[1]))

    def _clean_file(self, path: Path, year: int) -> None:
        destination = self._clean_dir / 'exams' / f'{year}.parquet'
        destination.parent.mkdir(parents=True, exist_ok=True)
        partial = destination.with_suffix('.parquet.part')
        with duckdb.connect() as db:
            db.execute('''COPY (SELECT CAST(NU_ANO_COMPETENCIA AS INTEGER) AS year,
                trim(CO_MUN_RESIDENCIA) AS municipality, count(*) AS exams
                FROM read_csv(?, delim=';', header=true, all_varchar=true)
                WHERE try_cast(CO_IDADE_PACIENTE AS INTEGER) BETWEEN 50 AND 69
                AND try_cast(CO_IND_CLINICA AS INTEGER) = 2 AND trim(SG_SEXO) = 'F'
                GROUP BY ALL) TO ? (FORMAT PARQUET)''', [str(path), str(partial)])
            years = db.execute('SELECT DISTINCT year FROM read_parquet(?)', [str(partial)]).fetchall()
            if years != [(year,)]:
                raise ValueError(f'{path.name}: empty screening extract or unexpected year')
        partial.replace(destination)
        (destination.with_suffix('.json')).write_text(json.dumps({
            'extracted_at': datetime.now(UTC).date().isoformat(), 'file': path.name,
            'size': path.stat().st_size, 'modified': path.stat().st_mtime,
        }))
        path.unlink()

    def compute(self) -> None:
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        regions = {m['code']: m['immediate_region'] for m in listing['municipalities']}
        files = [self._clean_dir / 'exams' / f'{year}.parquet' for year in YEARS]
        if any(not path.exists() for path in files):
            raise ValueError('SISCAN requires all annual files for 2016–2025')
        with duckdb.connect() as db:
            counts = {(year, code): n for year, code, n in db.execute(
                'SELECT year, municipality, sum(exams) FROM read_parquet(?) GROUP BY ALL',
                [[str(path) for path in files]]).fetchall()}
            population = {(year, code): n for year, code, n in db.execute('''
                SELECT year, municipality, sum(population) FROM read_parquet(?)
                WHERE sex=2 AND age BETWEEN 50 AND 69 GROUP BY ALL''', [str(self._population_path)]).fetchall()}
        available = {year for year, _ in population}
        first_population: dict[str, int] = {}
        for year, code in population:
            first_population[code] = min(first_population.get(code, year), year)
        if not regions.keys() <= first_population.keys():
            raise ValueError('missing population municipalities')
        series: dict[str, Series] = {code: {} for code in regions}
        provisional = set()
        for year in YEARS:
            selected = year if year in available else year - 1
            if selected not in available:
                raise ValueError(f'no population for {year} or the previous year')
            if selected != year:
                provisional.add(year)
            for code in regions:
                denominator = population.get((selected, code))
                if denominator is None:
                    if year < first_population[code] and not counts.get((year, code), 0):
                        continue
                    raise ValueError(f'missing population for {code} in {selected}')
                if denominator <= 0:
                    raise ValueError(f'nonpositive population for {code} in {selected}')
                series[code][year] = counts.get((year, code), 0), denominator / 2
        layer, profiles = mammography_data(series, regions, provisional)
        (self._clean_dir / 'layer.json').write_text(json.dumps(layer, allow_nan=False))
        (self._clean_dir / 'profiles.json').write_text(json.dumps(profiles, allow_nan=False))

    def validate(self) -> None:
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        layer = json.loads((self._clean_dir / 'layer.json').read_text())
        if set(layer['municipalities']) != {m['code'] for m in listing['municipalities']}:
            raise ValueError('SISCAN does not cover the mesh municipalities')
        profiles = json.loads((self._clean_dir / 'profiles.json').read_text())
        values = [entry['value'] for entry in layer['municipalities'].values()]
        values += [point['value'] for series in profiles['series'].values() for point in series]
        if any(value is not None and not 0 <= value <= MAXIMUM_RATIO for value in values):
            raise ValueError('SISCAN ratio outside plausible range 0–10')

    def export(self) -> None:
        """Validate again for standalone export; preserve other sources in shared profiles."""
        self.validate()
        layer = json.loads((self._clean_dir / 'layer.json').read_text())
        computed = json.loads((self._clean_dir / 'profiles.json').read_text())
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        files: dict[str, object] = {}
        for cancer_type in ('all', 'breast'):
            files[f'map/mammography/{cancer_type}.json'] = {
                'indicator': 'mammography', 'cancer_type': cancer_type, 'has_status': True, 'source': SOURCE, **layer}
        for uf in {m['uf'] for m in listing['municipalities']}:
            name = f'profiles/{uf}.json'
            path = self._site_data_dir / name
            profile = json.loads(path.read_text()) if path.exists() else {'uf': uf, 'indicators': {}}
            codes = {m['code'] for m in listing['municipalities'] if m['uf'] == uf}
            entries = {code: computed['municipalities'][code] for code in sorted(codes)}
            keys = {entry['series_id'] for entry in entries.values()} - {None}
            data = {'period': layer['period'], 'reference': layer['reference'], 'has_status': True,
                    'source': SOURCE, 'municipalities': entries, 'uf_trend': computed['uf_trends'][next(iter(codes))[:2]],
                    'series': {key: computed['series'][key] for key in sorted(keys)}}
            profile['indicators']['mammography'] = {cancer_type: data for cancer_type in ('all', 'breast')}
            files[name] = profile
        extracts = [json.loads((self._clean_dir / 'exams' / f'{year}.json').read_text()) for year in YEARS]
        files[MANIFEST] = updated_manifest(self._site_data_dir, source=self.name,
            extract={'name': SOURCE['name'], 'extracted_at': max(e['extracted_at'] for e in extracts),
                     'files': [e['file'] for e in extracts]},
            indicators={'mammography': {cancer_type: layer['period'] for cancer_type in ('all', 'breast')}})
        publish_together(self._site_data_dir, files)
