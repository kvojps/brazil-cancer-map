"""Frozen pre-reorganization calculation and intermediate results (#13)."""

import json
from pathlib import Path
import shutil

import duckdb

from pipeline.cli import main
from pipeline.sources.hpv import HpvSource
from pipeline.sources.painel import PainelSource
from pipeline.tests.test_hpv import prepared_source
from pipeline.tests.test_painel_state import documents, prepare

FIXTURES = Path(__file__).parent / 'fixtures'


def intermediate_state(clean):
    result = {'json': documents(clean), 'parquet': {}}
    with duckdb.connect() as db:
        for path in sorted(clean.rglob('*.parquet')):
            cursor = db.execute('SELECT * FROM read_parquet(?) ORDER BY ALL', [str(path)])
            result['parquet'][path.relative_to(clean).as_posix()] = {
                'columns': [column[0] for column in cursor.description],
                'rows': cursor.fetchall(),
            }
    return result


def assert_baseline(actual, name):
    expected = json.loads((FIXTURES / 'calculation-baseline.json').read_text())[name]
    # JSON canonicalization preserves 1 vs 1.0, booleans and nulls; SQL rows
    # compare logically rather than depending on Parquet compression bytes.
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)


def test_painel_calculation_intermediates_and_new_instances_match_frozen_baseline(tmp_path, monkeypatch):
    _, clean, site = prepare(tmp_path, monkeypatch)
    assert_baseline(intermediate_state(clean / 'painel'), 'painel')
    for step in ('compute', 'validate', 'export'):
        source = PainelSource(clean_dir=clean / 'painel', site_data_dir=site)
        assert main(['run', '--source', 'painel', '--step', step], [source]) == 0
    assert_baseline(intermediate_state(clean / 'painel'), 'painel')
    expected = json.loads((FIXTURES / 'painel-contract.json').read_text())
    actual = documents(site)
    assert actual['manifest.json']['pipeline_version']
    actual['manifest.json']['pipeline_version'] = expected['manifest.json']['pipeline_version']
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)


def test_hpv_official_calculation_intermediates_and_new_instances_match_frozen_baseline(tmp_path):
    source, site, clean = prepared_source(tmp_path, last_year=2026)
    official = tmp_path / 'official'
    official.mkdir()
    for name in ('official.json', 'census.parquet'):
        shutil.copyfile(clean / name, official / name)
    for step in ('compute', 'validate', 'export'):
        source = HpvSource(clean_dir=official, site_data_dir=site,
                           validation_path=tmp_path / 'references.json')
        assert main(['run', '--source', 'hpv', '--step', step], [source]) == 0
    assert_baseline(intermediate_state(official), 'hpv')
    expected = json.loads((FIXTURES / 'hpv-2026-contract.json').read_text())
    actual = documents(site)
    assert actual['manifest.json']['pipeline_version']
    actual['manifest.json']['pipeline_version'] = expected['manifest.json']['pipeline_version']
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)


def test_painel_calculates_in_memory_without_the_original_state(tmp_path, monkeypatch):
    from pipeline.sources.painel.calculation import calculate
    from pipeline.sources.painel.persistence import read_clean, read_months

    _, clean, site = prepare(tmp_path, monkeypatch)
    rows = read_clean(clean / 'painel')
    monthly_counts = read_months(clean / 'painel')
    listing = json.loads((site / 'municipalities.json').read_text())
    regions = {m['code']: m['immediate_region'] for m in listing['municipalities']}
    original_rows, original_months, original_regions = list(rows), dict(monthly_counts), dict(regions)
    expected = json.loads((FIXTURES / 'calculation-baseline.json').read_text())['painel']['json']
    shutil.rmtree(clean)
    shutil.rmtree(site)

    result = calculate(rows, monthly_counts, regions)

    actual: dict[str, object] = {'monthly_alerts.json': result.monthly_alerts}
    for cancer_type, layer in result.layers.items():
        actual[f'layers/{cancer_type}.json'] = layer
        actual[f'layers/{cancer_type}-profiles.json'] = result.profiles[cancer_type]
    expected = {name: value for name, value in expected.items()
                if name == 'monthly_alerts.json' or name.startswith('layers/')}
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)
    assert (rows, monthly_counts, regions) == (original_rows, original_months, original_regions)
    assert not clean.exists()
    assert not site.exists()
