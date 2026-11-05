"""Stream monthly SI-PNI archives into small, deduplicated HPV extracts."""

import csv
import io
import json
import re
import time
import zipfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import duckdb

from pipeline.cascade import Origin, data_origins
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.status import classify_status, status_note

from pipeline.download import HttpTransport, Transport, fetch, with_retries
from pipeline.hpv_inputs import download_fixed_inputs
from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR

EXTRACT_VERSION = 1

MONTHS = ('jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez')
SOURCE = {'name': 'SI-PNI/RNDS e TabNet (Ministério da Saúde)',
          'url': 'https://www.gov.br/saude/pt-br/vacinacao',
          'conditions': 'Dados abertos; reutilização com citação da fonte.',
          'period': 'Coorte de 9–14 anos; ao menos uma dose de HPV quadrivalente ou nonavalente.'}
CATALOG_ROOT = 'https://dadosabertos.saude.gov.br/dataset/doses-aplicadas-pelo-programa-de-nacional-de-imunizacoes-pni-'
S3_ROOT = 'https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/PNI/csv/'


class HpvSource:
    name = 'hpv'

    def __init__(self, *, raw_dir: Path = RAW_DIR / 'hpv',
                 clean_dir: Path = CLEAN_DIR / 'hpv', site_data_dir: Path = SITE_DATA_DIR,
                 years: tuple[int, ...] = tuple(range(2020, datetime.now(UTC).year + 1)),
                 validation_path: Path = Path(__file__).resolve().parents[1] / 'references' / 'hpv.json',
                 transport: Transport | None = None) -> None:
        if (not years or len(set(years)) != len(years)
                or any(year < 2020 or year > datetime.now(UTC).year for year in years)):
            raise ValueError('HPV years must be distinct years from 2020 through the current year')
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir
        self._site_data_dir = site_data_dir
        self._years = years
        self._transport = transport or HttpTransport()
        self._validation_path = validation_path

    def download(self) -> None:
        """Cache only reduced monthly files; callers can select one year per job."""
        download_fixed_inputs(self._raw_dir, self._clean_dir)
        today = datetime.now(UTC)
        for year in self._years:
            months = self._discover_months(year) if year == today.year else list(range(1, 13))
            for month in months:
                self.download_month(year, month)

    def _discover_months(self, year: int) -> list[int]:
        """Use advertised resources, never interpret an S3 access error as absence."""
        self._clean_dir.mkdir(parents=True, exist_ok=True)
        page = self._clean_dir / 'catalog.html.part'
        url = CATALOG_ROOT + str(year)
        try:
            with_retries(lambda: self._transport.get(url, page), f'read HPV catalog for {year}')
            names = set(re.findall(r'vacinacao_([a-z]{3})_' + str(year) + r'_csv\.zip', page.read_text()))
            months = [index for index, name in enumerate(MONTHS, 1) if name in names]
            if not months or months != list(range(1, max(months) + 1)):
                raise ValueError('HPV catalog has no monthly CSV resources or has internal gaps')
            (self._clean_dir / 'availability.json').write_text(json.dumps({
                'year': year, 'months': months, 'source_url': url,
                'checked_at': datetime.now(UTC).date().isoformat(),
            }))
            return months
        finally:
            page.unlink(missing_ok=True)

    def download_month(self, year: int, month: int) -> None:
        """Process one month, also used for a representative production benchmark."""
        if year < 2020 or month not in range(1, 13):
            raise ValueError('invalid SI-PNI month')
        path = self._raw_dir / f'vacinacao_{MONTHS[month - 1]}_{year}_csv.zip'
        url = S3_ROOT + path.name
        remote = with_retries(lambda: self._transport.head(url), f'inspect {path.name}')
        metadata = self._clean_dir / 'months' / str(year) / f'{month:02}.json'
        if metadata.exists() and metadata.with_suffix('.parquet').exists():
            previous = json.loads(metadata.read_text())
            if (remote.size is not None and remote.modified is not None
                    and previous.get('extract_version') == EXTRACT_VERSION and previous.get('size') == remote.size and previous.get('modified') == remote.modified):
                return
        started = time.monotonic()
        downloaded = fetch(url, path, transport=self._transport)
        download_seconds = time.monotonic() - started
        self._clean_file(path, year, month, started, download_seconds=download_seconds, downloaded=downloaded)

    def clean(self) -> None:
        """Read one ZIP member in flow, never materializing the uncompressed CSV."""
        pattern = re.compile(r'vacinacao_([a-z]{3})_(\d{4})_csv\.zip')
        for path in sorted(self._raw_dir.glob('*.zip')):
            match = pattern.fullmatch(path.name)
            if match and int(match[2]) in self._years and match[1] in MONTHS:
                self._clean_file(path, int(match[2]), MONTHS.index(match[1]) + 1, time.monotonic())

    def _clean_file(self, path: Path, year: int, month: int, started: float, *,
                    download_seconds: float = 0, downloaded: bool = False) -> None:
        destination = self._clean_dir / 'months' / str(year) / f'{month:02}.parquet'
        destination.parent.mkdir(parents=True, exist_ok=True)
        filtered = destination.with_suffix('.csv.part')
        partial = destination.with_suffix('.parquet.part')
        required = {'co_paciente', 'tp_sexo_paciente', 'co_municipio_paciente',
                    'co_vacina', 'st_documento', 'dt_vacina', 'nu_idade_paciente', 'dt_deletado_rnds'}
        peak_disk = path.stat().st_size
        excluded: dict[str, int] = {}
        rows_read = 0
        eligible = 0
        try:
            with zipfile.ZipFile(path) as archive, filtered.open('w', newline='') as output:
                members = [member for member in archive.infolist() if member.filename.lower().endswith('.csv')]
                if len(members) != 1:
                    raise ValueError(f'{path.name}: expected exactly one CSV')
                writer = csv.writer(output)
                writer.writerow(['patient', 'sex', 'municipality', 'date', 'age'])
                with archive.open(members[0]) as member:
                    rows = csv.DictReader(io.TextIOWrapper(member, encoding='latin1'), delimiter=';')
                    if not required <= set(rows.fieldnames or []):
                        raise ValueError(f'{path.name}: missing SI-PNI columns')
                    for row in rows:
                        rows_read += 1
                        if row['co_vacina'].strip() not in {'67', '93'} or row['dt_deletado_rnds'].strip() or row['st_documento'].strip() != 'final':
                            continue
                        age = row['nu_idade_paciente'].strip()
                        if not age.isdigit() or not 9 <= int(age) <= 14:
                            continue
                        patient, sex, code, date = (row[key].strip() for key in (
                            'co_paciente', 'tp_sexo_paciente', 'co_municipio_paciente', 'dt_vacina'))
                        reason = ('missing_patient' if not patient else
                                  'unknown_sex' if sex not in {'F', 'M'} else
                                  'invalid_municipality' if not re.fullmatch(r'\d{6}', code) else None)
                        if reason:
                            excluded[reason] = excluded.get(reason, 0) + 1
                            continue
                        if date[:7] != f'{year}-{month:02}':
                            raise ValueError(f'{path.name}: vaccination outside the file month')
                        writer.writerow([patient, sex, code, date[:10], age])
                        eligible += 1
            with duckdb.connect() as db:
                db.execute('''COPY (SELECT DISTINCT patient, sex, municipality, date, age
                    FROM read_csv(?, header=true, columns={patient: 'VARCHAR', sex: 'VARCHAR',
                    municipality: 'VARCHAR', date: 'DATE', age: 'INTEGER'})
                    QUALIFY row_number() OVER (PARTITION BY patient ORDER BY date, municipality, sex) = 1)
                    TO ? (FORMAT PARQUET)''', [str(filtered), str(partial)])
            peak_disk = sum(file.stat().st_size for folder in (self._raw_dir, self._clean_dir)
                            for file in folder.rglob('*') if file.is_file())
            partial.replace(destination)
            destination.with_suffix('.json').write_text(json.dumps({
                'extract_version': EXTRACT_VERSION, 'file': path.name, 'size': path.stat().st_size, 'modified': path.stat().st_mtime,
                'extracted_at': datetime.now(UTC).date().isoformat(),
                'duration_seconds': time.monotonic() - started, 'peak_disk_bytes': peak_disk,
                'download_seconds': download_seconds, 'downloaded': downloaded,
                'rows_read': rows_read, 'eligible_records': eligible, 'excluded': excluded,
            }))
            path.unlink()
        finally:
            filtered.unlink(missing_ok=True)
            partial.unlink(missing_ok=True)

    def compute(self) -> None:
        """Accumulate the NT 16/2025 age/year diagonals, counting each RNDS patient once."""
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        regions = {m['code']: m['immediate_region'] for m in listing['municipalities']}
        if self._years != tuple(range(2020, max(self._years) + 1)):
            raise ValueError('compute requires the complete history starting in 2020; use partitions only for download/clean')
        today = datetime.now(UTC)
        current_months = list(range(1, today.month))
        if today.year in self._years:
            availability = json.loads((self._clean_dir / 'availability.json').read_text())
            current_months = availability['months']
            if (availability.get('year') != today.year or not availability.get('source_url')
                    or not availability.get('checked_at') or not current_months
                    or current_months != list(range(1, max(current_months) + 1))
                    or max(current_months) > today.month):
                raise ValueError('invalid HPV catalog availability; refresh download')
        files = [self._clean_dir / 'months' / str(year) / f'{month:02}.parquet'
                 for year in self._years for month in range(1, 13)
                 if year < today.year or month in current_months]
        if any(not path.exists() for path in files):
            raise ValueError('HPV requires every published monthly extract; missing months are never zeros')
        for path in files:
            metadata_path = path.with_suffix('.json')
            if not metadata_path.exists() or json.loads(metadata_path.read_text()).get('extract_version') != EXTRACT_VERSION:
                raise ValueError('HPV requires current extraction metadata for every month')
        legacy_path = self._clean_dir / 'legacy.parquet'
        legacy_metadata = self._clean_dir / 'legacy.json'
        if not legacy_path.exists() or not legacy_metadata.exists():
            raise ValueError('official HPV cohorts require complete TabNet D1 history for 2015–2019')
        legacy = json.loads(legacy_metadata.read_text())
        if (not set(range(2015, 2020)) <= set(legacy.get('complete_years', []))
                or legacy.get('dose') != 'D1' or not legacy.get('source_url')):
            raise ValueError('incomplete or undocumented legacy HPV history')
        with duckdb.connect() as db:
            census_path = str(self._clean_dir / 'census.parquet')
            census = db.execute('SELECT municipality, sex, age, population FROM read_parquet(?)', [census_path]).fetchall()
            populations: dict[str, dict[str, int]] = {code: {'F': 0, 'M': 0} for code in regions}
            seen: set[tuple[str, str, int]] = set()
            for code, sex, age, population in census:
                if code not in regions or sex not in ('F', 'M') or age not in range(9, 15):
                    continue
                slice_key = (code, sex, age)
                if slice_key in seen or population is None or population < 0:
                    raise ValueError('duplicate or invalid Census 2022 population')
                seen.add(slice_key)
                populations[code][sex] += int(population)
            missing = {(code, sex, age) for code in regions for sex in ('F', 'M') for age in range(9, 15)} - seen
            absent = set(regions) - {item[0] for item in seen}
            if absent - {'510183'}:
                raise ValueError('unexpected municipality missing from Census 2022')
            if missing - {(code, sex, age) for code in absent for sex in ('F', 'M') for age in range(9, 15)}:
                raise ValueError('Census 2022 does not cover all municipality/sex/age slices; never use POPSVS as fallback')
            # Group before joining evaluation years so each patient has a single first qualifying dose.
            db.execute('''CREATE TABLE first_doses AS SELECT patient,
                first(sex ORDER BY date, municipality, sex) AS sex,
                first(municipality ORDER BY date, municipality, sex) AS municipality,
                min(date) AS date, first(year(date)-age ORDER BY date, municipality, sex) AS cohort
                FROM read_parquet(?) GROUP BY patient''', [[str(path) for path in files]])
            counts: dict[tuple[str, str, int], int] = {}
            for year in self._years:
                rows = db.execute('''SELECT municipality, sex, count(*) FROM first_doses
                    WHERE year(date) <= ? AND ? - cohort BETWEEN 9 AND 14 GROUP BY ALL''', [year, year]).fetchall()
                for code, sex, total in rows:
                    counts[code, sex, year] = total
                rows = db.execute('''SELECT municipality, sex, sum(vaccinated) FROM read_parquet(?)
                    WHERE year <= ? AND ? - (year-age) BETWEEN 9 AND 14 GROUP BY ALL''',
                    [str(legacy_path), year, year]).fetchall()
                for code, sex, total in rows:
                    count_key = (code, sex, year)
                    counts[count_key] = counts.get(count_key, 0) + total
        # A denominator, rather than dose volume, chooses the origin for the whole card.
        origins = data_origins({code: sum(populations[code].values()) for code in regions}, regions, years=1)
        members: dict[str, list[str]] = {f'municipality:{code}': [code] for code in regions}
        for code, region in regions.items():
            members.setdefault(f'immediate_region:{region}', []).append(code)
        provisional = [year for year in self._years if year >= today.year]
        consolidated = [year for year in self._years if year not in provisional]
        if not consolidated:
            raise ValueError('HPV requires a complete consolidated year')
        latest = max(consolidated)
        displayed: dict[str, list[dict[str, Any]]] = {}
        entries = {}
        for code, origin in origins.items():
            key = (f'municipality:{code}' if origin is Origin.MUNICIPALITY else
                   f'immediate_region:{regions[code]}' if origin is Origin.IMMEDIATE_REGION else None)
            if key and key not in displayed:
                points = []
                for year in self._years:
                    by_sex = {}
                    numerator = denominator = 0
                    for sex in ('F', 'M'):
                        n = sum(counts.get((member, sex, year), 0) for member in members[key])
                        d = sum(populations[member][sex] for member in members[key])
                        numerator += n
                        denominator += d
                        by_sex[sex] = coverage_result(n, d)
                    points.append({'year': year, **coverage_result(numerator, denominator),
                                   'by_sex': by_sex, 'single_dose': year == 2024,
                                   'provisional': year in provisional, 'without_treatment_info': None})
                displayed[key] = points
            point = next(p for p in displayed[key] if p['year'] == latest) if key else None
            result = {field: point[field] for field in ('value', 'status', 'status_note', 'by_sex')} if point else {
                **coverage_result(0, 0), 'by_sex': {sex: coverage_result(0, 0) for sex in ('F', 'M')}}
            entries[code] = {'origin': origin.value, **result, 'trend': None,
                             'denominator_note': ('Município criado após o Censo 2022; usamos a população do seu município e vizinhos.' if code in absent else None),
                             'quality_band': None, 'without_treatment_info': None, 'series_id': key}
        period = {'first_year': 2020, 'last_year': max(self._years), 'latest': latest,
                  'trend': [], 'provisional': provisional, 'single_dose_year': 2024,
                  'denominator_year': 2022,
                  'last_month': max(current_months) if max(self._years) == today.year else 12}
        data = {'period': period, 'reference': {'value': 90, 'label': 'meta para 2030'},
                'municipalities': entries, 'series': displayed}
        self._clean_dir.mkdir(parents=True, exist_ok=True)
        (self._clean_dir / 'computed.json').write_text(json.dumps(data, allow_nan=False))

    def validate(self) -> None:
        data = json.loads((self._clean_dir / 'computed.json').read_text())
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        if set(data['municipalities']) != {m['code'] for m in listing['municipalities']}:
            raise ValueError('HPV does not cover the mesh municipalities')
        for entry in list(data['municipalities'].values()) + [p for points in data['series'].values() for p in points]:
            for result in [entry, *entry['by_sex'].values()]:
                value = result['value']
                if value is not None and (not isinstance(value, (int, float)) or not 0 <= value < float('inf')):
                    raise ValueError('HPV coverage outside plausible nonnegative finite range')
                if result['status'] != classify_status(value, reference=90):
                    raise ValueError('HPV status inconsistent with coverage')

        if not self._validation_path.exists():
            raise ValueError('official HPV coverage references are required before publication')
        reference = json.loads(self._validation_path.read_text())
        if not reference.get('source_url') or not reference.get('extracted_at') or not reference.get('observations'):
            raise ValueError('official HPV coverage references require provenance and observations')
        tolerance = reference.get('tolerance_pp')
        if not isinstance(tolerance, (int, float)) or not 0 <= tolerance <= 1:
            raise ValueError('official HPV coverage comparison requires tolerance between 0 and 1 percentage point')
        sexes_checked = set()
        for observation in reference['observations']:
            code, year, sex = observation['municipality'], observation['year'], observation.get('sex')
            entry = data['municipalities'].get(code)
            if entry is None or entry['origin'] != 'municipality':
                raise ValueError('official HPV sample requires an eligible municipality, without regional substitution')
            point = next((point for point in data['series'][entry['series_id']] if point['year'] == year), None)
            if point is None or point['provisional'] or sex not in (None, 'F', 'M'):
                raise ValueError('official HPV sample has an unavailable year or sex')
            actual = point['value'] if sex is None else point['by_sex'][sex]['value']
            expected = observation['value']
            if (not isinstance(expected, (int, float)) or not 0 <= expected < float('inf')
                    or actual is None or abs(actual - expected) > tolerance):
                raise ValueError(f'HPV coverage differs from official reference for {code}/{year}/{sex}')
            sexes_checked.add(sex)
        if not {None, 'F', 'M'} <= sexes_checked:
            raise ValueError('official HPV references must check the total and both sexes')

    def export(self) -> None:
        """Publish only derived coverage, never patient identifiers or raw dose records."""
        self.validate()
        data = json.loads((self._clean_dir / 'computed.json').read_text())
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        files: dict[str, object] = {}
        common = {'period': data['period'], 'reference': data['reference'],
                  'source': SOURCE, 'has_status': True, 'has_trend': False}
        for cancer_type in ('all', 'cervix'):
            files[f'map/hpv/{cancer_type}.json'] = {
                **common, 'indicator': 'hpv', 'cancer_type': cancer_type,
                'municipalities': {code: {k: v for k, v in entry.items() if k != 'series_id'}
                                   for code, entry in data['municipalities'].items()}}
        for uf in {m['uf'] for m in listing['municipalities']}:
            name = f'profiles/{uf}.json'
            path = self._site_data_dir / name
            profile = json.loads(path.read_text()) if path.exists() else {'uf': uf, 'indicators': {}}
            codes = {m['code'] for m in listing['municipalities'] if m['uf'] == uf}
            entries = {code: data['municipalities'][code] for code in sorted(codes)}
            keys = {entry['series_id'] for entry in entries.values()} - {None}
            published = {**common, 'municipalities': entries, 'uf_trend': None,
                         'series': {key: data['series'][key] for key in sorted(keys)}}
            profile['indicators']['hpv'] = {cancer_type: published for cancer_type in ('all', 'cervix')}
            files[name] = profile
        extracts = [json.loads(path.read_text()) for path in (self._clean_dir / 'months').glob('*/*.json')]
        files[MANIFEST] = updated_manifest(self._site_data_dir, source=self.name,
            extract={'name': SOURCE['name'], 'extracted_at': max(e['extracted_at'] for e in extracts),
                     'files': [e['file'] for e in extracts]},
            indicators={'hpv': {cancer_type: data['period'] for cancer_type in ('all', 'cervix')}})
        publish_together(self._site_data_dir, files)


def coverage_result(numerator: int, denominator: int) -> dict[str, Any]:
    value = 100 * numerator / denominator if denominator else None
    return {'value': value, 'status': classify_status(value, reference=90),
            'status_note': status_note(value, maximum=100)}
