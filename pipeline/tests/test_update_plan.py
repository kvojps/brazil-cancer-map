"""Pure update planning returns ordered acceptance groups without construction."""

from pipeline.sources import SOURCE_DEFINITIONS, SourceDefinition


def test_population_and_panel_plan_without_constructing_sources():
    from pipeline.operations.update_plan import plan_update

    def forbidden_factory(clean, data, inputs):
        raise AssertionError('Planning must not construct sources')

    registry = tuple(SourceDefinition(
        definition.name, forbidden_factory, inputs=definition.inputs,
        update_with=definition.update_with, accept_with=definition.accept_with,
        includes_all=definition.includes_all,
    ) for definition in SOURCE_DEFINITIONS)
    selected = ['painel', 'popsvs']
    assert plan_update(selected, registry) == [
        ['popsvs', 'siscan', 'siscan_cytopathology', 'sim'], ['painel'],
    ]
    assert selected == ['painel', 'popsvs']


def definition(name, **relations):
    def forbidden_factory(clean, data, inputs):
        raise AssertionError('Planning must not construct sources')

    return SourceDefinition(name, forbidden_factory, **relations)


def test_sim_alone_does_not_select_its_population_producer():
    from pipeline.operations.update_plan import plan_update

    assert plan_update(['sim'], SOURCE_DEFINITIONS) == [['sim']]


def test_mesh_includes_future_entries_in_registry_order():
    from pipeline.operations.update_plan import plan_update

    registry = (*SOURCE_DEFINITIONS, definition('future'))
    assert plan_update(['mesh'], registry) == [[
        'mesh', 'popsvs', 'painel', 'cnes', 'siscan',
        'siscan_cytopathology', 'sim', 'hpv', 'inca', 'vigitel', 'future',
    ]]


def test_expansion_is_transitive_and_acceptance_only_joins_selected_participants():
    from pipeline.sources import SourceInput
    from pipeline.operations.update_plan import plan_update

    registry = (
        definition('population'),
        definition('independent'),
        definition('consumer', update_with=('population',), accept_with=('population',)),
        definition('downstream', update_with=('consumer',), accept_with=('consumer',)),
        definition('acceptance_only', accept_with=('population',)),
        definition('input_only', inputs={'value': SourceInput('population', 'value')}),
    )
    assert plan_update(['population', 'independent'], registry) == [
        ['population', 'consumer', 'downstream'], ['independent'],
    ]
    assert plan_update(['downstream'], registry) == [['downstream']]
    assert plan_update(['population', 'acceptance_only'], registry) == [
        ['population', 'consumer', 'downstream', 'acceptance_only'],
    ]


def test_invalid_selection_and_registry_are_rejected_without_construction():
    import pytest

    from pipeline.sources import SourceInput
    from pipeline.operations.update_plan import plan_update

    for selected in ([], ['missing']):
        with pytest.raises(ValueError, match='Select known sources'):
            plan_update(selected, SOURCE_DEFINITIONS)
    invalid_registries = (
        (definition('same'), definition('same')),
        (definition('consumer', update_with=('missing',)),),
        (definition('consumer', accept_with=('producer',)), definition('producer')),
        (definition('producer'), definition('consumer',
            inputs={'value': SourceInput('producer', '../escape')})),
        (definition('first'), definition('producer'), definition('consumer',
            inputs={'value': SourceInput('producer', 'value')}, accept_with=('first',))),
    )
    for registry in invalid_registries:
        with pytest.raises(ValueError):
            plan_update([entry.name for entry in registry], registry)
    with pytest.raises(ValueError, match='order'):
        plan_update(['first', 'producer', 'consumer'], invalid_registries[-1])
