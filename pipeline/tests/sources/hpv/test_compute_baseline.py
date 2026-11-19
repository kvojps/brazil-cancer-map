"""Frozen pre-reorganization HPV calculation and intermediate results (#13)."""

import json
from pathlib import Path
import shutil

from pipeline.cli import main
from pipeline.sources.hpv import HpvSource
from pipeline.tests.helpers import assert_baseline, documents, intermediate_state
from pipeline.tests.sources.hpv.helpers import prepared_source

FIXTURES = Path(__file__).parent / 'fixtures'


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
    assert_baseline(FIXTURES / 'compute-baseline.json', intermediate_state(official))
    expected = json.loads((FIXTURES / 'hpv-2026-contract.json').read_text())
    actual = documents(site)
    assert actual['manifest.json']['pipeline_version']
    actual['manifest.json']['pipeline_version'] = expected['manifest.json']['pipeline_version']
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)


def test_hpv_calculates_in_memory_without_the_original_state(tmp_path):
    from copy import deepcopy
    from dataclasses import asdict

    from pipeline.sources.hpv.compute import calculate
    from pipeline.sources.hpv.persistence import read_census, read_official

    _, site, clean = prepared_source(tmp_path, last_year=2026)
    official = read_official(clean)
    census = read_census(clean)
    listing = json.loads((site / 'municipalities.json').read_text())
    regions = {m['code']: m['immediate_region'] for m in listing['municipalities']}
    original = deepcopy((official, census, regions))
    expected = json.loads((FIXTURES / 'compute-baseline.json').read_text())['json']['computed.json']
    shutil.rmtree(clean)
    shutil.rmtree(site)

    result = calculate(official, census, regions)

    assert json.dumps(asdict(result), sort_keys=True) == json.dumps(expected, sort_keys=True)
    assert (official, census, regions) == original
    assert not clean.exists()
    assert not site.exists()
