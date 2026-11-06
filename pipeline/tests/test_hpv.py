"""HPV source behavior at the monthly-file boundary."""
import csv
from datetime import UTC, datetime
import io
import json
import zipfile

import duckdb

from pipeline.sources.hpv import HpvSource


def test_monthly_extract_counts_people_once_and_removes_raw(tmp_path):
    raw = tmp_path / 'raw'
    raw.mkdir()
    path = raw / 'vacinacao_jan_2020_csv.zip'
    fields = ['co_paciente', 'tp_sexo_paciente', 'co_municipio_paciente',
              'co_vacina', 'dt_vacina', 'nu_idade_paciente', 'dt_deletado_rnds', 'st_documento']
    stream = io.StringIO()
    writer = csv.writer(stream, delimiter=';')
    writer.writerow(fields)
    writer.writerows([
        ['one', 'F', '110001', '67', '2020-01-02', '9', '', 'final'],
        ['one', 'F', '110001', '67', '2020-01-03', '9', '', 'final'],
        ['two', 'M', '110001', '67', '2020-01-04', '14', '', 'final'],
        ['three', 'M', '110001', '67', '2020-01-04', '15', '', 'final'],
        ['deleted', 'F', '110001', '67', '2020-01-04', '9', '2021-01-01', 'final'],
        ['other', 'F', '110001', '9', '2020-01-04', '9', '', 'final'],
    ])
    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as archive:
        archive.writestr('vaccination.csv', stream.getvalue().encode('latin1'))
    source = HpvSource(raw_dir=raw, clean_dir=tmp_path / 'clean', years=(2020,))
    source.clean_audit()
    assert not path.exists()
    with duckdb.connect() as db:
        assert db.execute('SELECT patient, sex, age FROM read_parquet(?) ORDER BY patient',
                          [str(tmp_path / 'clean/months/2020/01.parquet')]).fetchall() == [
                              ('one', 'F', 9), ('two', 'M', 14)]
    measurement = json.loads((tmp_path / 'clean/months/2020/01.json').read_text())
    assert measurement['duration_seconds'] > 0
    assert measurement['peak_disk_bytes'] >= measurement['size']


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
        'source_url': 'https://example.test/official-cohorts', 'extracted_at': '2026-11-05',
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


def test_official_cohort_carries_first_dose_forward_and_uses_fixed_census(tmp_path):
    source, site, _ = prepared_source(tmp_path)
    source.compute()
    source.validate()
    source.export()
    layer = json.loads((site / 'map/hpv/all.json').read_text())
    entry = layer['municipalities']['110001']
    assert entry['value'] == 100 * 2 / 120
    assert entry['trend'] is None
    assert layer['period']['trend'] == []
    assert layer['reference'] == {'value': 90, 'label': 'meta para 2030'}
    assert layer['municipalities']['110002']['origin'] == 'immediate_region'
    assert layer['municipalities']['110003']['origin'] == 'insufficient'
    profile = json.loads((site / 'profiles/RO.json').read_text())['indicators']['hpv']['all']
    points = profile['series']['municipality:110001']
    assert [p['value'] for p in points] == [100 * 2 / 120] * 2
    assert entry['by_sex']['F']['value'] == 100 / 60
    assert entry['by_sex']['M']['value'] == 100 / 60
    assert layer['municipalities'] == json.loads((site / 'map/hpv/cervix.json').read_text())['municipalities']


def test_missing_month_or_baseline_never_becomes_zero_coverage(tmp_path):
    import pytest
    source, _, clean = prepared_source(tmp_path)
    path = clean / 'months/2021/12.parquet'
    original = path.read_bytes()
    path.unlink()
    with pytest.raises(ValueError, match='every published monthly'):
        source.compute_audit()
    path.write_bytes(original)
    (clean / 'legacy.json').unlink()
    with pytest.raises(ValueError, match='complete TabNet D1 history'):
        source.compute_audit()


def test_above_100_is_kept_and_invalid_export_preserves_previous_files(tmp_path):
    import pytest
    source, site, clean = prepared_source(tmp_path)
    with duckdb.connect() as db:
        path = clean / 'legacy.parquet'
        db.execute('CREATE TABLE legacy AS SELECT * FROM read_parquet(?)', [str(path)])
        db.execute('UPDATE legacy SET vaccinated=120')
        db.execute('COPY legacy TO ? (FORMAT PARQUET)', [str(path)])
    path = clean / 'official.json'
    official = json.loads(path.read_text())
    for row in official['records']:
        if row['municipality'] == '110001' and row['sex'] == 'Feminino':
            row.update(vaccinated=120, coverage=2)
    path.write_text(json.dumps(official))
    reference_path = tmp_path / 'references.json'
    reference = json.loads(reference_path.read_text())
    for observation in reference['observations']:
        observation['value'] = 200 if observation['sex'] == 'F' else 1.67 if observation['sex'] == 'M' else 100.83
    reference_path.write_text(json.dumps(reference))
    source.compute()
    source.export()
    layer = json.loads((site / 'map/hpv/all.json').read_text())
    entry = layer['municipalities']['110001']
    assert entry['value'] == 100 * 121 / 120
    assert entry['status'] == 'reached'
    assert entry['status_note'] == 'valor acima do esperado, provavelmente erro no registro ou na estimativa de população'
    assert entry['by_sex']['F']['value'] == 200
    previous = (site / 'manifest.json').read_bytes()
    path = clean / 'computed.json'
    data = json.loads(path.read_text())
    data['series']['municipality:110001'][0]['by_sex']['F']['value'] = -1
    path.write_text(json.dumps(data))
    with pytest.raises(ValueError, match='plausible'):
        source.export()
    assert (site / 'manifest.json').read_bytes() == previous


def test_new_municipality_uses_region_without_inventing_census_population(tmp_path):
    source, site, _ = prepared_source(tmp_path)
    path = site / 'municipalities.json'
    listing = json.loads(path.read_text())
    listing['municipalities'].append({'code': '510183', 'uf': 'MT', 'immediate_region': 'r1'})
    path.write_text(json.dumps(listing))
    source.compute()
    source.export()
    entry = json.loads((site / 'map/hpv/all.json').read_text())['municipalities']['510183']
    assert entry['origin'] == 'immediate_region'
    assert entry['value'] == 100 * 2 / 132
    assert 'Censo 2022' in entry['denominator_note']


def test_cohort_leaves_the_age_range_and_current_year_does_not_set_status(tmp_path):
    from datetime import UTC, datetime
    current = datetime.now(UTC).year
    if current < 2026:
        import pytest
        pytest.skip('requires the current year to include six years of public history')
    source, site, _ = prepared_source(tmp_path, last_year=current)
    source.compute()
    source.export()
    layer = json.loads((site / 'map/hpv/all.json').read_text())
    assert layer['period']['latest'] == current - 1
    assert layer['period']['provisional'] == [current]
    profile = json.loads((site / 'profiles/RO.json').read_text())['indicators']['hpv']['all']
    series = profile['series']['municipality:110001']
    assert next(p for p in series if p['year'] == 2026)['value'] == 0
    assert next(p for p in series if p['year'] == 2024)['single_dose'] is True


def test_official_comparison_is_required_and_divergence_blocks_publication(tmp_path):
    import pytest
    source, site, _ = prepared_source(tmp_path)
    source.compute()
    path = tmp_path / 'references.json'
    original = path.read_bytes()
    path.unlink()
    with pytest.raises(ValueError, match='official HPV coverage references are required'):
        source.export()
    assert not (site / 'map/hpv/all.json').exists()
    path.write_bytes(original)
    source.export()
    previous = (site / 'manifest.json').read_bytes()
    reference = json.loads(original)
    reference['observations'][0]['value'] = 50
    path.write_text(json.dumps(reference))
    with pytest.raises(ValueError, match='differs from official reference'):
        source.export()
    assert (site / 'manifest.json').read_bytes() == previous


def test_current_year_uses_catalog_boundary_and_rejects_internal_gaps(tmp_path):
    from datetime import UTC, datetime
    import pytest
    current = datetime.now(UTC).year
    source, _, clean = prepared_source(tmp_path, last_year=current)
    # A trailing month is unpublished; an internal missing month must still fail.
    last_month = min(9, datetime.now(UTC).month)
    for month in range(last_month + 1, 13):
        (clean / 'months' / str(current) / f'{month:02}.parquet').unlink()
    (clean / 'availability.json').write_text(json.dumps({
        'year': current, 'months': list(range(1, last_month + 1)),
        'source_url': f'https://dadosabertos.saude.gov.br/dataset/pni-{current}',
        'checked_at': datetime.now(UTC).date().isoformat(),
    }))
    source.compute_audit()
    assert json.loads((clean / 'audit.json').read_text())['records']
    (clean / 'months' / str(current) / '01.parquet').unlink()
    with pytest.raises(ValueError, match='every published monthly'):
        source.compute_audit()


def test_download_discovers_catalog_and_never_swallows_advertised_failures(tmp_path, monkeypatch):
    import pytest
    from pipeline.download import DownloadError, RemoteInfo
    from pipeline.sources.hpv import CATALOG_ROOT, MONTHS, S3_ROOT
    current = datetime.now(UTC).year
    clean = tmp_path / 'clean'
    folder = clean / 'months' / str(current)
    folder.mkdir(parents=True)
    for month in (1, 2):
        (folder / f'{month:02}.parquet').touch()
        (folder / f'{month:02}.json').write_text(json.dumps({
            'extract_version': 1, 'size': 100, 'modified': 10}))

    class CatalogTransport:
        catalog_months = [1, 2]
        fail = False
        inspected = []

        def get(self, url, dest):
            assert url == CATALOG_ROOT + str(current)
            dest.write_text(json.dumps({'resources': [
                {'url': f'{S3_ROOT}vacinacao_{MONTHS[month - 1]}_{current}_csv.zip'}
                for month in self.catalog_months]}))

        def head(self, url):
            self.inspected.append(url)
            if self.fail:
                raise OSError('advertised resource unavailable')
            return RemoteInfo(100, 10)

    transport = CatalogTransport()
    monkeypatch.setattr('pipeline.sources.hpv.download_fixed_inputs', lambda *args: None)
    monkeypatch.setattr('pipeline.sources.hpv.download_official_cohorts', lambda *args: None)
    monkeypatch.setattr('pipeline.download.time.sleep', lambda seconds: None)
    source = HpvSource(clean_dir=clean, years=(current,), transport=transport)
    source.download_audit()
    assert transport.inspected == [f'{S3_ROOT}vacinacao_{name}_{current}_csv.zip' for name in ('jan', 'fev')]
    assert json.loads((clean / 'availability.json').read_text())['months'] == [1, 2]
    transport.catalog_months = [1, 3]
    with pytest.raises(ValueError, match='internal gaps'):
        source.download_audit()
    transport.catalog_months = [1, 2]
    transport.fail = True
    with pytest.raises(DownloadError, match='advertised resource unavailable'):
        source.download_audit()


def test_official_qualified_cohorts_override_the_local_audit(tmp_path):
    source, site, clean = prepared_source(tmp_path)
    records = [
        {'year': year, 'municipality': code, 'sex': sex, 'vaccinated': count,
         'population': population, 'coverage': count / population}
        for year in (2020, 2021)
        for code, population in [('110001', 60), ('110002', 6), ('110003', 6)]
        for sex in ('Feminino', 'Masculino')
        for count in [12 if code == '110001' else 0]
    ]
    (clean / 'official.json').write_text(json.dumps({
        'source_url': 'https://example.test/official-cohorts', 'extracted_at': '2026-11-05',
        'years': [2020, 2021], 'records': records}))
    source.compute()
    data = json.loads((clean / 'computed.json').read_text())
    assert data['municipalities']['110001']['value'] == 20
    source.compute_audit()
    audit = json.loads((clean / 'audit.json').read_text())
    assert next(row for row in audit['records'] if row['municipality'] == '110001'
                and row['sex'] == 'F' and row['year'] == 2021)['vaccinated'] == 1


def test_official_cohorts_require_complete_census_matched_slices(tmp_path):
    import pytest
    source, _, clean = prepared_source(tmp_path)
    path = clean / 'official.json'
    official = json.loads(path.read_text())
    original = path.read_text()
    official['records'][0]['population'] += 1
    path.write_text(json.dumps(official))
    with pytest.raises(ValueError, match='Census denominator mismatch'):
        source.compute()
    official = json.loads(original)
    official['records'].pop()
    path.write_text(json.dumps(official))
    with pytest.raises(ValueError, match='missing municipality, sex or year'):
        source.compute()


def test_publication_uses_only_official_aggregates_and_census(tmp_path):
    import shutil
    source, site, clean = prepared_source(tmp_path)
    shutil.rmtree(clean / 'months')
    (clean / 'legacy.parquet').unlink()
    (clean / 'legacy.json').unlink()
    source.compute()
    source.validate()
    source.export()
    layer = json.loads((site / 'map/hpv/all.json').read_text())
    assert layer['municipalities']['110001']['value'] == 100 / 60
    assert 'audit_last_month' not in layer['period']
    assert not (clean / 'audit.json').exists()
    manifest = json.loads((site / 'manifest.json').read_text())
    assert manifest['sources']['hpv']['files'] == ['official.json', 'census.parquet']


def test_indicator_clean_does_not_run_optional_patient_audit(tmp_path):
    raw = tmp_path / 'raw'
    raw.mkdir()
    # An interrupted optional audit must not break the official aggregate flow.
    (raw / 'vacinacao_jan_2020_csv.zip').write_bytes(b'incomplete audit download')
    HpvSource(raw_dir=raw, clean_dir=tmp_path / 'clean', years=(2020,)).clean()
    assert (raw / 'vacinacao_jan_2020_csv.zip').exists()
