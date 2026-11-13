"""Optional local patient reconstruction, never an input to official coverage."""

import csv
import io
import json
import re
import time
import zipfile
from datetime import UTC, datetime
from pathlib import Path

import duckdb

from pipeline.download import HttpTransport, Transport, fetch, with_retries
from pipeline.sources.hpv.historical_inputs import download_fixed_inputs
from pipeline.paths import CLEAN_DIR, RAW_DIR

EXTRACT_VERSION = 1

MONTHS = ('jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez')

CATALOG_ROOT = 'https://dadosabertos.saude.gov.br/dataset/doses-aplicadas-pelo-programa-de-nacional-de-imunizacoes-pni-'

S3_ROOT = 'https://s3.sa-east-1.amazonaws.com/ckan.saude.gov.br/PNI/csv/'


class HpvAudit:
    def __init__(self, *, raw_dir: Path = RAW_DIR / 'hpv',
                 clean_dir: Path = CLEAN_DIR / 'hpv',
                 years: tuple[int, ...] | None = None,
                 transport: Transport | None = None) -> None:
        if years is None:
            years = tuple(range(2020, datetime.now(UTC).year + 1))
        if (not years or len(set(years)) != len(years)
                or any(year < 2020 or year > datetime.now(UTC).year for year in years)):
            raise ValueError('HPV years must be distinct years from 2020 through the current year')
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir
        self._years = years
        self._transport = transport or HttpTransport()

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
        # Keep the independent microdata reconstruction as an audit, never publish it as qualified coverage.
        (self._clean_dir / 'audit.json').write_text(json.dumps({'records': [
            {'municipality': code, 'sex': sex, 'year': year, 'vaccinated': count}
            for (code, sex, year), count in sorted(counts.items())]}))
