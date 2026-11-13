"""Observable update behavior before the module reorganization (#13)."""

from datetime import UTC, datetime
import json

import pytest

from pipeline.cli import main
from pipeline.sources import create_sources
from pipeline.tests.test_cli import FakeSource

NAMES = ['mesh', 'popsvs', 'painel', 'cnes', 'siscan',
         'siscan_cytopathology', 'sim', 'hpv', 'inca', 'vigitel']
POPULATION_GROUP = ['popsvs', 'siscan', 'siscan_cytopathology', 'sim']


def files(root):
    return {p.relative_to(root).as_posix(): p.read_bytes()
            for p in root.rglob('*') if p.is_file()}


class Clock(datetime):
    @classmethod
    def now(cls, tz=None):
        return cls(2026, 11, 13, 12, tzinfo=UTC)


@pytest.fixture
def scenario(tmp_path, monkeypatch):
    live, clean, output = (tmp_path / name for name in ('live', 'clean', 'review'))
    live.mkdir()
    (live / 'municipalities.json').write_text('{"municipalities": []}')
    (live / 'manifest.json').write_text('{"sources":{"sim":{"extracted_at":"old"}}}')
    for name in NAMES:
        (clean / name).mkdir(parents=True)
        (clean / name / 'previous').write_text(name)
    (clean / 'popsvs/population.parquet').write_bytes(b'available population')
    (clean / 'hpv/official.json').write_text('{}')
    (clean / 'hpv/census.parquet').write_bytes(b'census')
    (clean / 'hpv/months').mkdir()
    (clean / 'hpv/months/private.parquet').write_bytes(b'patient audit')
    log: list[tuple[str, str]] = []
    failures: dict[str, str] = {}

    class WritingSource(FakeSource):
        def __init__(self, name, state, data):
            super().__init__(name, log, failures.get(name))
            self.state, self.data = state, data

        def download(self):
            super().download()
            # Even failed groups may have changed files before validation.
            (self.state / self.name).mkdir(exist_ok=True)
            (self.state / self.name / 'attempt').write_text('new state')
            (self.data / f'{self.name}.json').write_text('{"attempt":true}')
            if self.name == 'sim':
                assert (self.state / 'popsvs/population.parquet').read_bytes() == b'available population'
            if self.name == 'painel' and ('popsvs', 'export') in log and 'sim' not in failures:
                assert (self.data / 'popsvs.json').exists()

    def registry(clean_dir=clean, site_data_dir=live, **kwargs):
        return [WritingSource(name, clean_dir, site_data_dir) for name in NAMES]

    monkeypatch.setattr('pipeline.update.create_sources', registry)
    monkeypatch.setattr('pipeline.update.datetime', Clock)
    return live, clean, output, log, failures


def run_update(scenario, selected):
    live, clean, output, _, _ = scenario
    before = files(live), files(clean)
    args = ['update', '--data-dir', str(live), '--clean-dir', str(clean), '--output', str(output)]
    for name in selected:
        args.extend(['--source', name])
    code = main(args, [])
    assert (files(live), files(clean)) == before
    assert not list(output.glob('update-*'))
    report = json.loads((output / 'update.json').read_text())
    assert report['attempted_at'] == '2026-11-13T12:00:00+00:00'
    assert report['selected'] == selected
    return code, report


@pytest.mark.parametrize('selected,expected', [
    (['painel', 'popsvs'], [*POPULATION_GROUP, 'painel']),
    (['sim'], ['sim']),
    (['mesh'], NAMES),
])
def test_selection_execution_order_and_isolated_outputs(scenario, selected, expected):
    live, clean, output, log, _ = scenario
    code, report = run_update(scenario, selected)
    assert code == 0
    assert log == [(name, step) for name in expected
                   for step in ('download', 'clean', 'compute', 'validate', 'export')]
    assert report == {'attempted_at': '2026-11-13T12:00:00+00:00',
                      'selected': selected, 'successful': expected, 'failures': []}
    for name in expected:
        assert (output / 'dados' / f'{name}.json').read_text() == '{"attempt":true}'
        assert (output / 'clean' / name / 'attempt').read_text() == 'new state'
    assert not (output / 'clean/hpv/months').exists()
    # Accepted snapshots are copies, not shared files with the live inputs.
    (output / 'clean/popsvs/population.parquet').write_bytes(b'changed review')
    assert (clean / 'popsvs/population.parquet').read_bytes() == b'available population'


def test_late_group_failure_discards_all_members_and_continues_in_order(scenario):
    _, clean, output, log, failures = scenario
    failures['sim'] = 'validate'
    failures['cnes'] = 'compute'
    selected = ['cnes', 'painel', 'popsvs']
    code, report = run_update(scenario, selected)
    assert code == 1
    assert report['successful'] == ['painel']
    assert report['failures'] == [
        {'sources': POPULATION_GROUP, 'error': 'sim: validate failed: sim failed at validate'},
        {'sources': ['cnes'], 'error': 'cnes: compute failed: cnes failed at compute'},
    ]
    assert log == [
        *[(name, step) for name in POPULATION_GROUP[:-1]
          for step in ('download', 'clean', 'compute', 'validate', 'export')],
        *[('sim', step) for step in ('download', 'clean', 'compute', 'validate')],
        *[('painel', step) for step in ('download', 'clean', 'compute', 'validate', 'export')],
        ('cnes', 'download'), ('cnes', 'clean'), ('cnes', 'compute'),
    ]
    for name in [*POPULATION_GROUP, 'cnes']:
        assert not (output / 'dados' / f'{name}.json').exists()
        assert files(output / 'clean' / name) == files(clean / name)
    assert (output / 'dados/manifest.json').read_text() == '{"sources":{"sim":{"extracted_at":"old"}}}'


def test_mesh_failure_discards_every_source(scenario):
    live, _, output, _, failures = scenario
    failures['vigitel'] = 'validate'
    code, report = run_update(scenario, ['mesh'])
    assert code == 1
    assert report['successful'] == []
    assert report['failures'] == [{'sources': NAMES,
                                 'error': 'vigitel: validate failed: vigitel failed at validate'}]
    assert files(output / 'dados') == files(live)


@pytest.mark.parametrize('selected', [[], ['missing']])
def test_invalid_selection_creates_no_output(scenario, selected):
    from pipeline.update import update_sources

    live, clean, output, log, _ = scenario
    with pytest.raises(ValueError, match='Select known sources'):
        update_sources(selected, live, clean, output)
    assert not output.exists()
    assert log == []


def test_public_registry_preserves_source_order(tmp_path):
    # The orchestration double above does not establish the real registry order.
    assert [source.name for source in create_sources(tmp_path / 'clean', tmp_path / 'dados')] == NAMES


def test_direct_sim_compute_uses_existing_snapshot_population(tmp_path, monkeypatch):
    import shutil
    from pipeline.tests.test_sim import fixture_source

    source, clean, site = fixture_source(tmp_path, monkeypatch)
    source.clean()
    state = tmp_path / 'snapshot'
    shutil.copytree(clean, state / 'sim')
    (state / 'popsvs').mkdir()
    shutil.copyfile(tmp_path / 'population.parquet', state / 'popsvs/population.parquet')
    population = (state / 'popsvs/population.parquet').read_bytes()
    assert main(['run', '--source', 'sim', '--step', 'compute'], create_sources(state, site)) == 0
    assert (state / 'sim/computed.json').exists()
    assert (state / 'popsvs/population.parquet').read_bytes() == population
