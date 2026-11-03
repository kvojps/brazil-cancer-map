import struct
import zipfile

import duckdb
import pytest

from pipeline.sources.popsvs import PopsvsSource


def archive(path, year, rows, lowercase=False):
    fields = [('COD_MUN', 7), ('ANO', 4), ('SEXO', 1), ('IDADE', 5), ('POP', 12)]
    header = bytearray(32)
    header[0] = 3
    struct.pack_into('<IHH', header, 4, len(rows), 32 + 32 * len(fields) + 1, 30)
    body = bytes(header)
    for name, width in fields:
        field = bytearray(32)
        encoded = (name.lower() if lowercase else name).encode()
        field[:len(encoded)] = encoded
        field[11] = ord('C')
        field[16] = width
        body += field
    body += b'\r'
    for code, sex, age, count in rows:
        values = (code, str(year), str(sex), str(age), str(count))
        body += b' ' + b''.join(value.encode().ljust(width) for value, (_, width) in zip(values, fields))
    with zipfile.ZipFile(path, 'w') as zipped:
        zipped.writestr('population.dbf', body + b'\x1a')


def test_clean_reads_both_column_cases_and_preserves_municipal_history(tmp_path):
    raw, clean = tmp_path / 'raw', tmp_path / 'clean'
    raw.mkdir()
    archive(raw / 'POPSBR24.zip', 2024, [('5106240', 2, 50, 12108)])
    archive(raw / 'POPSBR25.zip', 2025, [('5106240', 2, 50, 9760), ('5101837', 2, 80, 5877)], True)
    PopsvsSource(raw_dir=raw, clean_dir=clean).clean()
    with duckdb.connect() as db:
        rows = db.execute('SELECT * FROM read_parquet(?) ORDER BY year, municipality', [str(clean / 'population.parquet')]).fetchall()
    assert rows == [('510624', 2024, 2, 50, 12108), ('510183', 2025, 2, 80, 5877), ('510624', 2025, 2, 50, 9760)]


def test_validation_checks_every_state_and_brazil_and_rejects_duplicates(tmp_path):
    clean = tmp_path / 'clean'
    clean.mkdir()
    # Independent approximate 2022 totals, one synthetic municipality per UF.
    totals = {'11': 1600000, '12': 800000, '13': 4000000, '14': 600000,
              '15': 8100000, '16': 700000, '17': 1500000, '21': 6800000,
              '22': 3300000, '23': 8800000, '24': 3300000, '25': 4000000,
              '26': 9100000, '27': 3100000, '28': 2200000, '29': 14100000,
              '31': 20500000, '32': 3800000, '33': 16100000, '35': 44400000,
              '41': 11400000, '42': 7600000, '43': 10900000, '50': 2800000,
              '51': 3700000, '52': 7100000, '53': 2800000}
    path = clean / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('CREATE TABLE population (municipality VARCHAR, year INTEGER, sex INTEGER, age INTEGER, population BIGINT)')
        db.executemany('INSERT INTO population VALUES (?,2022,?,?,?)', [
            (uf + '0001', sex, age, total if sex == 1 and age == 0 else 0)
            for uf, total in totals.items() for sex in (1, 2) for age in range(81)])
        db.execute('COPY population TO ? (FORMAT PARQUET)', [str(path)])
        source = PopsvsSource(clean_dir=clean)
        source.validate()
        db.execute("UPDATE population SET population=1 WHERE municipality LIKE '35%'")
        db.execute('COPY population TO ? (FORMAT PARQUET)', [str(path)])
        with pytest.raises(ValueError, match='UF 35'):
            source.validate()
        db.execute('INSERT INTO population SELECT * FROM population LIMIT 1')
        db.execute('COPY population TO ? (FORMAT PARQUET)', [str(path)])
        with pytest.raises(ValueError, match='cells'):
            source.validate()


def test_download_uses_incremental_cache(tmp_path, monkeypatch):
    from pipeline.download import RemoteInfo, fetch
    from pipeline.sources import popsvs

    class Transport:
        downloads = 0

        def head(self, url):
            return RemoteInfo(size=3, modified=1000)

        def get(self, url, destination):
            self.downloads += 1
            destination.write_bytes(b'zip')

    transport = Transport()
    monkeypatch.setattr(popsvs, 'list_ftp', lambda url: ['POPSBR00.zip', 'POPSBR25.zip', 'other.zip'])
    monkeypatch.setattr(popsvs, 'fetch', lambda url, destination: fetch(url, destination, transport=transport))
    source = PopsvsSource(raw_dir=tmp_path)
    source.download()
    source.download()
    assert transport.downloads == 2
