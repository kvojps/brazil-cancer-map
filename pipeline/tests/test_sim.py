import json

import duckdb
import pytest

from pipeline.sources.sim import SimSource


def fixture_source(tmp_path, monkeypatch):
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
    for year in range(2014, 2025):
        (raw / f'DOBR{year}.dbc').touch()
    def records(path):
        year = int(path.stem[4:])
        for _ in range(100):
            yield {'CODMUNRES': '261160', 'CODMUNOCOR': '355030', 'CAUSABAS': 'C509',
                   'SEXO': '2', 'IDADE': '450', 'DTOBITO': f'0101{year}', 'TIPOBITO': '2'}
        yield {'CODMUNRES': '261160', 'CAUSABAS': 'C509', 'SEXO': '1', 'IDADE': '450',
               'DTOBITO': f'0101{year}', 'TIPOBITO': '2'}
        for cause, age in [('C449', '450'), ('C539', '999'), ('C539', '301'), ('C539', '580')]:
            yield {'CODMUNRES': '260020', 'CAUSABAS': cause, 'SEXO': '2', 'IDADE': age,
                   'DTOBITO': f'0101{year}', 'TIPOBITO': '2'}
    monkeypatch.setattr('pipeline.sources.sim.read_records', records)
    reference = tmp_path / 'atlas.json'
    reference.write_text(json.dumps({'source': 'https://mortalidade.inca.gov.br/MortalidadeWeb/',
        'checks': [{'year': 2022, 'cancer_type': 'breast', 'area': 'BR', 'deaths': 100,
                    'rate': 100 / 15000 * 5000}]}))
    return SimSource(raw_dir=raw, clean_dir=clean, site_data_dir=site,
                     population_path=population, reference_path=reference), clean, site


def test_source_standardizes_before_region_cascade_and_exports_without_status(tmp_path, monkeypatch):
    source, clean, site = fixture_source(tmp_path, monkeypatch)
    source.clean()
    source.compute()
    source.export()
    layer = json.loads((site / 'map/mortality/breast.json').read_text())
    # All 100 deaths are female aged 50: 100 / 5000 women × Segi weight 5000 = 100 per 100,000.
    assert layer['municipalities']['261160']['value'] == pytest.approx(100)
    assert layer['municipalities']['260005']['value'] == pytest.approx(50)
    assert layer['municipalities']['260005']['origin'] == 'immediate_region'
    assert layer['municipalities']['260020']['origin'] == 'insufficient'
    assert layer['has_status'] is False
    assert layer['reference'] is None
    assert layer['municipalities']['261160']['status'] is None
    assert layer['period']['trend'] == [2015, 2024]
    profile = json.loads((site / 'profiles/PE.json').read_text())['indicators']['mortality']['breast']
    assert profile['national_trend'] == 'stable'
    assert len(profile['series']['municipality:261160']) == 11
    with duckdb.connect() as db:
        rows = db.execute('SELECT cancer_type, age_group, sum(deaths) FROM read_parquet(?) '
                          'WHERE year=2022 GROUP BY ALL', [str(clean / 'deaths.parquet')]).fetchall()
    assert ('cervix', -1, 1) in rows
    assert ('cervix', 0, 1) in rows
    assert ('cervix', 80, 1) in rows
    assert sum(n for kind, _, n in rows if kind == 'all') == 104


@pytest.mark.parametrize('field,value', [('deaths', 99), ('rate', 40)])
def test_atlas_mismatch_blocks_export_and_preserves_published_data(tmp_path, monkeypatch, field, value):
    source, clean, site = fixture_source(tmp_path, monkeypatch)
    source.clean()
    source.compute()
    source.export()
    published = (site / 'map/mortality/breast.json').read_bytes()
    reference = tmp_path / 'atlas.json'
    checks = json.loads(reference.read_text())
    checks['checks'][0][field] = value
    reference.write_text(json.dumps(checks))
    with pytest.raises(ValueError, match='differs from Atlas'):
        source.export()
    assert (site / 'map/mortality/breast.json').read_bytes() == published


def test_download_only_fetches_consolidated_national_files_and_reuses_cache(tmp_path):
    from pipeline.download import RemoteInfo

    class Transport:
        urls: list[str] = []

        def head(self, url):
            return RemoteInfo(size=3, modified=1000)

        def get(self, url, dest):
            self.urls.append(url)
            dest.write_bytes(b'dbc')

    transport = Transport()
    source = SimSource(raw_dir=tmp_path, transport=transport)
    source.download()
    source.download()
    assert [url.rsplit('/', 1)[1] for url in transport.urls] == [f'DOBR{y}.dbc' for y in range(2014, 2025)]
    assert all('/DORES/' in url for url in transport.urls)


def test_trend_uses_population_offset_and_decreasing_mortality_is_improving(tmp_path, monkeypatch):
    source, clean, site = fixture_source(tmp_path, monkeypatch)
    path = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('CREATE TABLE growing AS SELECT * REPLACE '
                   '(CAST(population * pow(1.10, year-2014) AS BIGINT) AS population) FROM read_parquet(?)', [str(path)])
        db.execute('COPY growing TO ? (FORMAT PARQUET)', [str(path)])
    source.clean()
    source.compute()
    data = json.loads((clean / 'computed.json').read_text())['breast']
    assert data['municipalities']['261160']['trend'] == 'improving'
    assert data['national_trend'] == 'improving'
    assert data['municipalities']['260005']['trend'] == 'improving'
