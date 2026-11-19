"""SISCAN state shared by the screening tests."""

import json

import duckdb

from pipeline.sources.siscan import SiscanSource


def prepared_source(tmp_path):
    raw, clean, site = (tmp_path / name for name in ('raw', 'clean', 'site'))
    raw.mkdir()
    site.mkdir()
    municipalities = [
        {'code': code, 'name': code, 'uf': 'PE', 'immediate_region': region}
        for code, region in [('261160', 'r1'), ('260005', 'r1'), ('260010', 'r1'), ('260020', 'r2')]]
    (site / 'municipalities.json').write_text(json.dumps({'municipalities': municipalities}))
    population = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('CREATE TABLE population (municipality VARCHAR, year INTEGER, sex INTEGER, age INTEGER, population BIGINT)')
        db.executemany('INSERT INTO population VALUES (?,?,2,50,100)',
                       [(m['code'], year) for m in municipalities for year in range(2016, 2026)])
        # Excluded ages and males must not enter the denominator.
        db.execute("INSERT INTO population VALUES ('261160',2025,1,50,900), ('261160',2025,2,70,900)")
        db.execute('COPY population TO ? (FORMAT PARQUET)', [str(population)])
    for year in range(2016, 2026):
        (raw / f'SISCAN_MAMOGRAFIA_{year}.csv').write_text(
            'CO_MUN_RESIDENCIA;NU_ANO_COMPETENCIA;CO_IDADE_PACIENTE;CO_IND_CLINICA;SG_SEXO\n' +
            ''.join(f'{code};{year};050;02;F\n' * count
                    for code, count in [('261160', 40), ('260005', 5), ('260020', 1), ('999999', 10)]))
    return SiscanSource(raw_dir=raw, clean_dir=clean, site_data_dir=site, population_path=population), site, clean
