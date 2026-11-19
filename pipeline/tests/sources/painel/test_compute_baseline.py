"""Frozen pre-reorganization Painel calculation and intermediate results (#13)."""

import json
from pathlib import Path
import shutil

from pipeline.cli import main
from pipeline.sources.painel import PainelSource
from pipeline.tests.helpers import assert_baseline, documents, intermediate_state
from pipeline.tests.sources.painel.helpers import prepare

FIXTURES = Path(__file__).parent / 'fixtures'


def test_painel_calculation_intermediates_and_new_instances_match_frozen_baseline(tmp_path, monkeypatch):
    _, clean, site = prepare(tmp_path, monkeypatch)
    assert_baseline(FIXTURES / 'compute-baseline.json', intermediate_state(clean / 'painel'))
    for step in ('compute', 'validate', 'export'):
        source = PainelSource(clean_dir=clean / 'painel', site_data_dir=site)
        assert main(['run', '--source', 'painel', '--step', step], [source]) == 0
    assert_baseline(FIXTURES / 'compute-baseline.json', intermediate_state(clean / 'painel'))
    expected = json.loads((FIXTURES / 'painel-contract.json').read_text())
    actual = documents(site)
    assert actual['manifest.json']['pipeline_version']
    actual['manifest.json']['pipeline_version'] = expected['manifest.json']['pipeline_version']
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)


def test_painel_calculates_in_memory_without_the_original_state(tmp_path, monkeypatch):
    from pipeline.sources.painel.compute import calculate
    from pipeline.sources.painel.persistence import read_clean, read_months

    _, clean, site = prepare(tmp_path, monkeypatch)
    rows = read_clean(clean / 'painel')
    monthly_counts = read_months(clean / 'painel')
    listing = json.loads((site / 'municipalities.json').read_text())
    regions = {m['code']: m['immediate_region'] for m in listing['municipalities']}
    original_rows, original_months, original_regions = list(rows), dict(monthly_counts), dict(regions)
    expected = json.loads((FIXTURES / 'compute-baseline.json').read_text())['json']
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
