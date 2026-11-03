import json

import duckdb

from pipeline.sources.siscan import SiscanSource


def test_cytopathology_clean_filters_age_and_freezes_series(tmp_path):
    raw, clean = tmp_path / 'raw', tmp_path / 'clean'
    raw.mkdir()
    header = 'CO_MUN_RESIDENCIA;CO_ANO_LIBERACAO;CO_IDADE_PACIENTE;SG_SEXO\n'
    path = raw / 'SISCAN_CITO_COLO_2025.csv'
    path.write_text(header + '261160;2025;025;F\n261160;2025;064;F\n'
                    '261160;2025;024;F\n261160;2025;065;F\n261160;2025;bad;F\n261160;2025;030;M\n')
    future = raw / 'SISCAN_CITO_COLO_2026.csv'
    future.write_text(header + '261160;2026;030;F\n')
    SiscanSource(raw_dir=raw, clean_dir=clean, indicator='cytopathology').clean()
    with duckdb.connect() as db:
        assert db.execute('SELECT * FROM read_parquet(?)',
                          [str(clean / 'exams/2025.parquet')]).fetchall() == [(2025, '261160', 2)]
    assert not path.exists()
    assert future.exists()
    assert not (clean / 'exams/2026.parquet').exists()


def test_cytopathology_exports_triennial_ratio_offset_and_preserves_mammography(tmp_path):
    raw, clean, site = (tmp_path / name for name in ('raw', 'clean', 'site'))
    raw.mkdir()
    site.mkdir()
    (site / 'municipalities.json').write_text(json.dumps({'municipalities': [
        {'code': '261160', 'uf': 'PE', 'immediate_region': 'r1'},
        {'code': '260005', 'uf': 'PE', 'immediate_region': 'r1'},
        {'code': '260020', 'uf': 'PE', 'immediate_region': 'r2'},
    ]}))
    (site / 'profiles').mkdir()
    (site / 'profiles/PE.json').write_text(json.dumps({'uf': 'PE', 'indicators': {'mammography': {'kept': True}}}))
    population = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('''COPY (SELECT municipality, year, 2 AS sex, age,
            CASE WHEN municipality='261160' THEN 300 - 20*(year-2016) ELSE 300 END AS population
            FROM (VALUES ('261160'), ('260005'), ('260020')) m(municipality),
            range(2016,2027) y(year), (VALUES (24), (25), (64), (65)) a(age)
            UNION ALL SELECT '261160',2025,1,25,9000) TO ? (FORMAT PARQUET)''', [str(population)])
    for year in range(2016, 2027):
        (raw / f'SISCAN_CITO_COLO_{year}.csv').write_text(
            'CO_MUN_RESIDENCIA;CO_ANO_LIBERACAO;CO_IDADE_PACIENTE;SG_SEXO\n' +
            f'261160;{year};025;F\n' * 80 + f'260005;{year};064;F\n' * 5 + f'260020;{year};025;F\n')
    source = SiscanSource(raw_dir=raw, clean_dir=clean, site_data_dir=site,
                          population_path=population, indicator='cytopathology')
    source.clean()
    source.compute()
    source.export()
    layer = json.loads((site / 'map/cytopathology/all.json').read_text())
    entry = layer['municipalities']['261160']
    # 80 examinations / ((120 + 120 women aged 25 and 64) / 3) = 1.
    assert entry['value'] == 1
    assert entry['status'] == 'reached'
    assert entry['trend'] == 'improving'
    assert layer['reference'] == {'value': 1, 'label': 'meta'}
    assert layer['period']['trend'] == [2016, 2025]
    assert layer['period']['latest'] == layer['period']['last_year'] == 2025
    assert layer['municipalities']['260005']['origin'] == 'immediate_region'
    assert layer['municipalities']['260020']['origin'] == 'insufficient'
    assert layer['municipalities'] == json.loads((site / 'map/cytopathology/cervix.json').read_text())['municipalities']
    profile = json.loads((site / 'profiles/PE.json').read_text())['indicators']
    assert profile['mammography'] == {'kept': True}
    assert [p['year'] for p in profile['cytopathology']['all']['series']['municipality:261160']] == list(range(2016, 2026))
    assert len(json.loads((site / 'manifest.json').read_text())['sources']['siscan_cytopathology']['files']) == 10
