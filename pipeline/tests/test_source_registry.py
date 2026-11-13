"""Public registry construction binds declared inputs to the working snapshot."""

import pytest

from pipeline.sources import SourceDefinition, SourceInput, create_sources
from pipeline.tests.test_cli import FakeSource


def test_new_consumer_receives_declared_snapshot_input_by_name(tmp_path):
    received = {}

    def consumer(clean, data, inputs):
        received.update(inputs)
        assert clean == tmp_path / 'clean/new_consumer'
        assert data == tmp_path / 'dados'
        return FakeSource('new_consumer', [])

    definitions = (
        SourceDefinition('population', lambda clean, data, inputs: FakeSource('population', [])),
        SourceDefinition('new_consumer', consumer,
                         inputs={'population_path': SourceInput('population', 'population.parquet')}),
    )
    sources = create_sources(tmp_path / 'clean', tmp_path / 'dados', registry=definitions)
    assert [source.name for source in sources] == ['population', 'new_consumer']
    assert received == {'population_path': tmp_path / 'clean/population/population.parquet'}
    assert not (tmp_path / 'clean').exists()


@pytest.mark.parametrize('invalid', ['duplicate', 'input', 'update', 'accept', 'order', 'escape'])
def test_invalid_registry_rejected_before_factories_create_output(tmp_path, invalid):
    def factory(clean, data, inputs):
        data.mkdir(parents=True)
        return FakeSource('producer', [])

    producer = SourceDefinition('producer', factory)
    consumer = SourceDefinition('consumer', factory,
                                inputs={'value': SourceInput('producer', 'value.parquet')})
    definitions = {
        'duplicate': (producer, producer),
        'input': (SourceDefinition('consumer', factory, inputs={'value': SourceInput('missing', 'v')}),),
        'update': (SourceDefinition('consumer', factory, update_with=('missing',)),),
        'accept': (SourceDefinition('consumer', factory, accept_with=('missing',)),),
        'order': (consumer, producer),
        'escape': (producer, SourceDefinition('consumer', factory,
                                            inputs={'value': SourceInput('producer', '../other/v')})),
    }[invalid]
    with pytest.raises(ValueError):
        create_sources(tmp_path / 'clean', tmp_path / 'dados', registry=definitions)
    assert not (tmp_path / 'dados').exists()
    from pipeline.update import update_sources

    with pytest.raises(ValueError):
        update_sources(['consumer'], tmp_path / 'live', tmp_path / 'clean', tmp_path / 'review', registry=definitions)
    assert not (tmp_path / 'review').exists()


@pytest.mark.parametrize('selected,expected,update_with,accept_with', [
    (['popsvs'], ['popsvs', 'new_consumer'], ('popsvs',), ('popsvs',)),
    (['new_consumer'], ['new_consumer'], ('popsvs',), ('popsvs',)),
    (['mesh'], ['mesh', 'popsvs', 'new_consumer'], ('popsvs',), ('popsvs',)),
    (['popsvs'], ['popsvs'], (), ('popsvs',)),
    (['popsvs'], ['popsvs'], (), ()),
])
def test_update_uses_new_consumer_relations_and_future_mesh_entries(
        tmp_path, selected, expected, update_with, accept_with):
    from pipeline.update import update_sources

    log: list[tuple[str, str]] = []

    def consumer(clean, data, inputs):
        assert inputs['population_path'] == clean.parent / 'popsvs/population.parquet'
        assert inputs['population_path'].read_bytes() == b'frozen population'
        return FakeSource('new_consumer', log)

    registry = (
        SourceDefinition('mesh', lambda clean, data, inputs: FakeSource('mesh', log), includes_all=True),
        SourceDefinition('popsvs', lambda clean, data, inputs: FakeSource('popsvs', log)),
        SourceDefinition('new_consumer', consumer,
                         inputs={'population_path': SourceInput('popsvs', 'population.parquet')},
                         update_with=update_with, accept_with=accept_with),
    )
    live, clean, output = (tmp_path / name for name in ('live', 'clean', 'review'))
    live.mkdir()
    (live / 'municipalities.json').write_text('{}')
    (clean / 'popsvs').mkdir(parents=True)
    (clean / 'popsvs/population.parquet').write_bytes(b'frozen population')
    assert update_sources(selected, live, clean, output, registry=registry)
    assert log == [(name, step) for name in expected
                   for step in ('download', 'clean', 'compute', 'validate', 'export')]


@pytest.mark.parametrize('name,indicator,expected', [
    ('siscan', 'mammography', 0.8),
    ('siscan_cytopathology', 'cytopathology', 1.2),
])
def test_screening_factories_compute_with_population_only_in_snapshot(tmp_path, name, indicator, expected):
    import json
    import shutil

    from pipeline.cli import main
    from pipeline.tests.test_siscan import prepared_source

    source, site, clean = prepared_source(tmp_path)
    source.clean()
    snapshot = tmp_path / 'snapshot'
    shutil.copytree(clean, snapshot / name)
    (snapshot / 'popsvs').mkdir()
    shutil.move(tmp_path / 'population.parquet', snapshot / 'popsvs/population.parquet')
    for step in ('compute', 'export'):
        assert main(['run', '--source', name, '--step', step], create_sources(snapshot, site)) == 0
    layer = json.loads((site / f'map/{indicator}/all.json').read_text())
    assert layer['municipalities']['261160']['value'] == expected


def test_joint_acceptance_cannot_run_consumer_before_selected_input_producer(tmp_path):
    from pipeline.update import update_sources

    live, clean, output = (tmp_path / name for name in ('live', 'clean', 'review'))
    live.mkdir()
    clean.mkdir()
    (live / 'municipalities.json').write_text('{}')
    definitions = (
        SourceDefinition('first', lambda clean, data, inputs: FakeSource('first', [])),
        SourceDefinition('producer', lambda clean, data, inputs: FakeSource('producer', [])),
        SourceDefinition('consumer', lambda clean, data, inputs: FakeSource('consumer', []),
                         inputs={'value': SourceInput('producer', 'value.parquet')},
                         accept_with=('first',)),
    )
    with pytest.raises(ValueError, match='order'):
        update_sources(['first', 'producer', 'consumer'], live, clean, output, registry=definitions)
    assert not output.exists()
