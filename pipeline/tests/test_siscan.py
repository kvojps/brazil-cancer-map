import json

import duckdb
import pytest

from pipeline.sources.siscan import SiscanSource


def test_clean_counts_screening_exams_by_residence_and_removes_raw(tmp_path):
    raw, clean = tmp_path / 'raw', tmp_path / 'clean'
    raw.mkdir()
    path = raw / 'SISCAN_MAMOGRAFIA_2025.csv'
    path.write_text('CO_MUN_RESIDENCIA;NU_ANO_COMPETENCIA;CO_IDADE_PACIENTE;CO_IND_CLINICA;SG_SEXO\n'
                    '261160;2025;050;02;F\n261160;2025;069;02;F\n'
                    '261160;2025;049;02;F\n261160;2025;070;02;F\n'
                    '261160;2025;060;01;F\n261160;2025;060;02;M\n'
                    '999999;2025;060;02;F\n')
    SiscanSource(raw_dir=raw, clean_dir=clean).clean()
    with duckdb.connect() as db:
        rows = db.execute('SELECT * FROM read_parquet(?) ORDER BY municipality',
                          [str(clean / 'exams' / '2025.parquet')]).fetchall()
    assert rows == [(2025, '261160', 2), (2025, '999999', 1)]
    assert not path.exists()


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


def test_source_publishes_ratio_numerator_cascade_and_shared_profile_series(tmp_path):
    source, site, _ = prepared_source(tmp_path)
    source.clean()
    source.compute()
    source.validate()
    source.export()
    layer = json.loads((site / 'map/mammography/all.json').read_text())
    entries = layer['municipalities']
    assert entries['261160']['value'] == 0.8
    assert entries['261160']['status'] == 'near'
    assert entries['261160']['trend'] == 'stable'
    assert entries['260005']['origin'] == 'immediate_region'
    assert entries['260005']['value'] == 0.3
    assert entries['260010'] == entries['260005']
    assert entries['260020']['origin'] == 'insufficient'
    assert entries['260020']['value'] is None
    assert layer['reference'] == {'value': 1, 'label': 'meta'}
    assert layer['period']['trend'] == [2016, 2025]
    assert layer['municipalities'] == json.loads((site / 'map/mammography/breast.json').read_text())['municipalities']
    profile = json.loads((site / 'profiles/PE.json').read_text())['indicators']['mammography']['all']
    assert profile['municipalities']['260005']['series_id'] == profile['municipalities']['260010']['series_id']
    assert profile['municipalities']['260020']['series_id'] is None
    assert len(profile['series']['municipality:261160']) == 10
    assert profile['uf_trend'] == 'stable'
    assert json.loads((site / 'manifest.json').read_text())['indicators']['mammography']['all']['latest'] == 2025


def test_export_rejects_bad_values_or_missing_municipalities_without_publishing(tmp_path):
    source, site, clean = prepared_source(tmp_path)
    source.clean()
    source.compute()
    source.export()
    previous = (site / 'manifest.json').read_bytes()
    layer_path = clean / 'layer.json'
    valid = layer_path.read_text()
    for value in (-1, 11, float('nan')):
        layer = json.loads(valid)
        layer['municipalities']['261160']['value'] = value
        layer_path.write_text(json.dumps(layer))
        with pytest.raises(ValueError, match='plausible'):
            source.export()
        assert (site / 'manifest.json').read_bytes() == previous
    layer = json.loads(valid)
    del layer['municipalities']['261160']
    layer_path.write_text(json.dumps(layer))
    with pytest.raises(ValueError, match='municipalities'):
        source.export()


def test_download_reduces_each_file_before_next_and_reuses_unchanged_extracts(tmp_path):
    from pipeline.download import RemoteInfo

    class Transport:
        downloads = 0
        modified = 1000.0

        def head(self, url):
            return RemoteInfo(size=len(self.body(url)), modified=self.modified)

        def body(self, url):
            year = url.rsplit('_', 1)[1][:4]
            return (f'CO_MUN_RESIDENCIA;NU_ANO_COMPETENCIA;CO_IDADE_PACIENTE;CO_IND_CLINICA;SG_SEXO\n'
                    f'261160;{year};050;02;F\n').encode()

        def get(self, url, destination):
            assert not list((tmp_path / 'raw').glob('*.csv'))
            self.downloads += 1
            destination.write_bytes(self.body(url))

    transport = Transport()
    source = SiscanSource(raw_dir=tmp_path / 'raw', clean_dir=tmp_path / 'clean', transport=transport)
    source.download()
    source.download()
    assert transport.downloads == 10
    transport.modified = 2000.0
    source.download()
    assert transport.downloads == 20
    assert not list((tmp_path / 'raw').glob('*.csv'))


def test_population_offset_and_above_expected_note_are_not_clamped(tmp_path):
    source, site, _ = prepared_source(tmp_path)
    path = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('CREATE TABLE population AS SELECT * FROM read_parquet(?)', [str(path)])
        # Constant examination counts with declining population must improve.
        db.execute("UPDATE population SET population = 100 - 10*(year-2016) WHERE municipality='261160' AND sex=2 AND age=50")
        db.execute('COPY population TO ? (FORMAT PARQUET)', [str(path)])
    source.clean()
    source.compute()
    source.export()
    entry = json.loads((site / 'map/mammography/all.json').read_text())['municipalities']['261160']
    assert entry['value'] == 8
    assert entry['status'] == 'reached'
    assert entry['trend'] == 'improving'
    assert entry['status_note'] == 'valor acima do esperado, provavelmente erro no registro ou na estimativa de população'


def test_missing_population_year_is_provisional_and_excluded_from_latest_value(tmp_path):
    source, site, _ = prepared_source(tmp_path)
    path = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('COPY (SELECT * FROM read_parquet(?) WHERE year != 2025) TO ? (FORMAT PARQUET)',
                   [str(path), str(path.with_suffix('.new'))])
    path.with_suffix('.new').replace(path)
    source.clean()
    source.compute()
    source.export()
    layer = json.loads((site / 'map/mammography/all.json').read_text())
    assert layer['period']['latest'] == 2024
    assert layer['period']['provisional'] == [2025]
    assert layer['period']['trend'] == [2016, 2024]
    profile = json.loads((site / 'profiles/PE.json').read_text())['indicators']['mammography']['all']
    assert profile['series']['municipality:261160'][-1]['provisional'] is True


def test_failed_clean_keeps_raw_and_last_good_aggregate(tmp_path):
    source, _, clean = prepared_source(tmp_path)
    source.clean()
    previous = (clean / 'exams/2025.parquet').read_bytes()
    raw = tmp_path / 'raw/SISCAN_MAMOGRAFIA_2025.csv'
    raw.write_text('CO_MUN_RESIDENCIA;NU_ANO_COMPETENCIA;CO_IDADE_PACIENTE;CO_IND_CLINICA;SG_SEXO\n261160;2024;050;02;F\n')
    with pytest.raises(ValueError, match='unexpected year'):
        source.clean()
    assert raw.exists()
    assert (clean / 'exams/2025.parquet').read_bytes() == previous


def test_incomplete_population_slice_does_not_trigger_previous_year_fallback(tmp_path):
    source, _, _ = prepared_source(tmp_path)
    path = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('''COPY (SELECT * FROM read_parquet(?)
            WHERE NOT (year=2025 AND sex=2 AND age BETWEEN 50 AND 69)) TO ? (FORMAT PARQUET)''',
            [str(path), str(path.with_suffix('.new'))])
    path.with_suffix('.new').replace(path)
    source.clean()
    with pytest.raises(ValueError, match='population for municipality .* in 2025'):
        source.compute()
