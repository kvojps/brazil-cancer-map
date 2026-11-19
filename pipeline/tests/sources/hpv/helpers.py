"""HPV state shared by the HPV tests."""

from datetime import UTC, datetime
import json

import duckdb

from pipeline.sources.hpv import HpvSource


def prepared_source(tmp_path, last_year=2021):
    clean, site = tmp_path / 'clean', tmp_path / 'site'
    site.mkdir()
    codes = [('110001', 'r1'), ('110002', 'r1'), ('110003', 'r2')]
    (site / 'municipalities.json').write_text(json.dumps({'municipalities': [
        {'code': code, 'uf': 'RO', 'immediate_region': region} for code, region in codes]}))
    clean.mkdir()
    with duckdb.connect() as db:
        # A complete age/sex census slice: 120 residents in one municipality,
        # 12 in another (uses the region), and 12 in an isolated region.
        db.execute('CREATE TABLE census (municipality VARCHAR, sex VARCHAR, age INTEGER, population INTEGER)')
        db.executemany('INSERT INTO census VALUES (?,?,?,?)', [
            (code, sex, age, 10 if code == '110001' else 1)
            for code, _ in codes for sex in ('F', 'M') for age in range(9, 15)])
        db.execute('COPY census TO ? (FORMAT PARQUET)', [str(clean / 'census.parquet')])
        db.execute('CREATE TABLE legacy (year INTEGER, municipality VARCHAR, sex VARCHAR, age INTEGER, vaccinated INTEGER)')
        # A person vaccinated at 9 in 2019 remains eligible at 10 in 2020 and 11 in 2021.
        db.execute("INSERT INTO legacy VALUES (2019,'110001','F',9,1)")
        db.execute('COPY legacy TO ? (FORMAT PARQUET)', [str(clean / 'legacy.parquet')])
        db.execute('CREATE TABLE doses (patient VARCHAR, sex VARCHAR, municipality VARCHAR, date DATE, age INTEGER)')
        db.execute("INSERT INTO doses VALUES ('one','M','110001','2020-01-02',9)")
        for year in range(2020, last_year + 1):
            for month in range(1, 13):
                folder = clean / 'months' / str(year)
                folder.mkdir(parents=True, exist_ok=True)
                path = folder / f'{month:02}.parquet'
                db.execute('COPY (SELECT * FROM doses WHERE year(date)=? AND month(date)=?) TO ? (FORMAT PARQUET)',
                           [year, month, str(path)])
                path.with_suffix('.json').write_text(json.dumps({'extract_version': 1, 'file': f'{year}-{month:02}', 'extracted_at': '2026-11-04'}))
        # The same person has a second dose in another month/year: still counted only once.
        path = clean / 'months/2021/02.parquet'
        db.execute("COPY (SELECT 'one' AS patient, 'M' AS sex, '110001' AS municipality, DATE '2021-02-02' AS date, 10 AS age) TO ? (FORMAT PARQUET)", [str(path)])
    (clean / 'legacy.json').write_text(json.dumps({
        'source_url': 'https://tabnet.datasus.gov.br/', 'complete_years': list(range(2015, 2020)),
        'extracted_at': '2026-11-04', 'dose': 'D1'}))
    reference_path = tmp_path / 'references.json'
    reference_path.write_text(json.dumps({
        'source_url': 'https://example.test/official-fixture', 'extracted_at': '2026-11-04',
        'tolerance_pp': 0.01,
        'observations': [{'municipality': '110001', 'year': 2021, 'sex': sex, 'value': 1.67}
                         for sex in (None, 'F', 'M')],
    }))
    if last_year == datetime.now(UTC).year:
        (clean / 'availability.json').write_text(json.dumps({
            'year': last_year, 'months': list(range(1, datetime.now(UTC).month + 1)),
            'source_url': 'https://example.test/catalog', 'checked_at': '2026-11-05'}))
    (clean / 'official.json').write_text(json.dumps({
        'source_url': 'https://example.test/official-cohorts',
        'extracted_at': f'{max(2026, last_year)}-11-05',
        'years': list(range(2020, last_year + 1)), 'records': [
            {'year': year, 'municipality': code, 'sex': sex,
             'vaccinated': count, 'population': population, 'coverage': count / population}
            for year in range(2020, last_year + 1)
            for code, population in [('110001', 60), ('110002', 6), ('110003', 6)]
            for sex in ('Feminino', 'Masculino')
            for count in [int(code == '110001' and year <= (2024 if sex == 'Feminino' else 2025))]
        ]}))
    source = HpvSource(clean_dir=clean, site_data_dir=site, years=tuple(range(2020, last_year + 1)),
                       validation_path=reference_path)
    return source, site, clean
