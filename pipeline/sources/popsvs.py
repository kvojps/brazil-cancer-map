"""Revised MS/SVSA population series, kept as denominators for compute steps."""

import csv
import json
import re
import tempfile
import zipfile
from pathlib import Path

import dbfread
import duckdb

from pipeline.download import fetch, list_ftp
from pipeline.paths import CLEAN_DIR, RAW_DIR

FTP_ROOT = 'ftp://ftp.datasus.gov.br/dissemin/publicos/IBGE/POPSVS/'
# Rounded 2022 state populations, in millions. Broad bounds span 2000–2025;
# these are extraction sanity checks, not comparisons with old official rates.
STATE_BASELINES = {
    '11': 1.6, '12': 0.8, '13': 4.0, '14': 0.6, '15': 8.1, '16': 0.7,
    '17': 1.5, '21': 6.8, '22': 3.3, '23': 8.8, '24': 3.3, '25': 4.0,
    '26': 9.1, '27': 3.1, '28': 2.2, '29': 14.1, '31': 20.5, '32': 3.8,
    '33': 16.1, '35': 44.4, '41': 11.4, '42': 7.6, '43': 10.9,
    '50': 2.8, '51': 3.7, '52': 7.1, '53': 2.8,
}


class PopsvsSource:
    name = 'popsvs'

    def __init__(self, *, raw_dir: Path = RAW_DIR / 'popsvs',
                 clean_dir: Path = CLEAN_DIR / 'popsvs') -> None:
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir

    def download(self) -> None:
        names = sorted(name for name in list_ftp(FTP_ROOT)
                       if re.fullmatch(r'POPSBR(?:0\d|1\d|2[0-5])\.zip', name, re.IGNORECASE))
        if not names:
            raise ValueError('no POPSVS archives available')
        for name in names:
            fetch(FTP_ROOT + name, self._raw_dir / name)
        (self._raw_dir / 'extract.json').write_text(json.dumps({'files': names}))

    def clean(self) -> None:
        self._clean_dir.mkdir(parents=True, exist_ok=True)
        manifest = self._raw_dir / 'extract.json'
        names = (json.loads(manifest.read_text())['files'] if manifest.exists()
                 else sorted(path.name for path in self._raw_dir.glob('POPSBR*.zip')))
        if not names:
            raise ValueError('no POPSVS archives to clean')
        destination = self._clean_dir / 'population.parquet'
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            table = directory / 'population.csv'
            with table.open('w', newline='') as output:
                writer = csv.writer(output)
                writer.writerow(['municipality', 'year', 'sex', 'age', 'population'])
                for name in names:
                    year = 2000 + int(name[6:8])
                    with zipfile.ZipFile(self._raw_dir / name) as archive:
                        members = [member for member in archive.namelist() if member.lower().endswith('.dbf')]
                        if len(members) != 1:
                            raise ValueError(f'{name}: expected one DBF')
                        dbf_path = directory / 'population.dbf'
                        dbf_path.write_bytes(archive.read(members[0]))
                    for record in dbfread.DBF(str(dbf_path), encoding='latin-1'):
                        row = {key.lower(): value for key, value in record.items()}
                        code = str(row['cod_mun']).strip()
                        record_year, sex, age, population = (int(row[key]) for key in ('ano', 'sexo', 'idade', 'pop'))
                        if (len(code) != 7 or not code.isdigit() or record_year != year
                                or sex not in (1, 2) or not 0 <= age <= 80 or population < 0):
                            raise ValueError(f'{name}: invalid population record')
                        writer.writerow([code[:6], record_year, sex, age, population])
            with duckdb.connect() as db:
                db.execute('''COPY (SELECT * FROM read_csv(?, header=true, columns={
                    'municipality':'VARCHAR', 'year':'INTEGER', 'sex':'INTEGER',
                    'age':'INTEGER', 'population':'BIGINT'})) TO ? (FORMAT PARQUET)''',
                    [str(table), str(destination.with_suffix('.parquet.part'))])
            destination.with_suffix('.parquet.part').replace(destination)

    def compute(self) -> None:
        """No indicator statistics: population is consumed by other compute steps."""

    def validate(self) -> None:
        with duckdb.connect() as db:
            db.read_parquet(str(self._clean_dir / 'population.parquet')).create_view('population')
            invalid = db.execute('''SELECT count(*) FROM population WHERE
                NOT regexp_full_match(municipality, '[0-9]{6}') OR year NOT BETWEEN 2000 AND 2025
                OR sex NOT IN (1,2) OR age NOT BETWEEN 0 AND 80 OR population < 0
                OR municipality IS NULL OR year IS NULL OR sex IS NULL OR age IS NULL OR population IS NULL''').fetchone()
            incomplete = db.execute('''SELECT municipality, year FROM population GROUP BY municipality, year
                HAVING count(*) != 162 OR count(DISTINCT (sex, age)) != 162''').fetchall()
            if invalid is None or invalid[0] or incomplete:
                raise ValueError('invalid or incomplete POPSVS population cells')
            totals = db.execute('SELECT year, substr(municipality,1,2), sum(population) FROM population GROUP BY ALL').fetchall()
        national: dict[int, int] = {}
        states: dict[int, set[str]] = {}
        for year, uf, total in totals:
            baseline = STATE_BASELINES.get(uf)
            if baseline is None or not baseline * 450_000 <= total <= baseline * 1_550_000:
                raise ValueError(f'POPSVS {year}: implausible UF {uf} population {total}')
            national[year] = national.get(year, 0) + total
            states.setdefault(year, set()).add(uf)
        if not national or any(not 160_000_000 <= total <= 230_000_000
                               or states[year] != STATE_BASELINES.keys() for year, total in national.items()):
            raise ValueError('implausible Brazil population or missing UFs')

    def export(self) -> None:
        """No site indicator for population alone; guard direct export runs too."""
        self.validate()
