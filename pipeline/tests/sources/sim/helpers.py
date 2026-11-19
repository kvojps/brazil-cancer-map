"""SIM inputs shared by the mortality tests."""

import json
import shutil
import struct

import datasus_dbc
import duckdb

from pipeline.sources.sim import SimSource


def write_dbf(path, records):
    fields = [('CODMUNRES', 6), ('CODMUNOCOR', 6), ('CAUSABAS', 4), ('SEXO', 1),
              ('IDADE', 3), ('DTOBITO', 8), ('TIPOBITO', 1)]
    records = list(records)
    header = bytearray(32)
    header[0] = 3
    struct.pack_into('<IHH', header, 4, len(records), 32 + 32 * len(fields) + 1,
                     1 + sum(width for _, width in fields))
    body = bytes(header)
    for name, width in fields:
        descriptor = bytearray(32)
        descriptor[:len(name)] = name.encode()
        descriptor[11], descriptor[16] = ord('C'), width
        body += descriptor
    body += b'\r'
    for row in records:
        body += b' ' + b''.join(row.get(name, '').encode().ljust(width) for name, width in fields)
    path.write_bytes(body + b'\x1a')


def fixture_source(tmp_path, monkeypatch, *, annual_deaths=None):
    raw, clean, site = (tmp_path / name for name in ('raw', 'clean', 'site'))
    raw.mkdir()
    site.mkdir()
    (site / 'municipalities.json').write_text(json.dumps({'municipalities': [
        {'code': '261160', 'uf': 'PE', 'immediate_region': 'r1'},
        {'code': '260005', 'uf': 'PE', 'immediate_region': 'r1'},
        {'code': '260020', 'uf': 'PE', 'immediate_region': 'r2'}]}))
    population = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('''COPY (SELECT municipality, year, sex, age, 1000 AS population
            FROM (VALUES ('261160'), ('260005'), ('260020')) m(municipality),
            range(2014,2025) y(year), range(1,3) s(sex), range(0,81) a(age))
            TO ? (FORMAT PARQUET)''', [str(population)])
    def records(year):
        for _ in range(100 if annual_deaths is None else annual_deaths[year]):
            yield {'CODMUNRES': '261160', 'CODMUNOCOR': '355030', 'CAUSABAS': 'C509',
                   'SEXO': '2', 'IDADE': '450', 'DTOBITO': f'0101{year}', 'TIPOBITO': '2'}
        yield {'CODMUNRES': '261160', 'CAUSABAS': 'C509', 'SEXO': '1', 'IDADE': '450',
               'DTOBITO': f'0101{year}', 'TIPOBITO': '2'}
        for cause, age in [('C449', '450'), ('C539', '999'), ('C539', '301'), ('C539', '580')]:
            yield {'CODMUNRES': '260020', 'CAUSABAS': cause, 'SEXO': '2', 'IDADE': age,
                   'DTOBITO': f'0101{year}', 'TIPOBITO': '2'}
    for year in range(2014, 2025):
        write_dbf(raw / f'DOBR{year}.dbc', records(year))
    monkeypatch.setattr(datasus_dbc, 'decompress', lambda src, dest: shutil.copyfile(src, dest))
    reference = tmp_path / 'atlas.json'
    reference.write_text(json.dumps({'source': 'https://mortalidade.inca.gov.br/MortalidadeWeb/',
        'checks': [{'year': 2022, 'cancer_type': 'breast', 'area': 'BR', 'deaths': 100,
                    'rate': 100 / 15000 * 5000}]}))
    return SimSource(raw_dir=raw, clean_dir=clean, site_data_dir=site,
                     population_path=population, reference_path=reference), clean, site
