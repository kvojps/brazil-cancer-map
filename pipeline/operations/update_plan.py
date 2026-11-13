"""Plan ordered update acceptance groups without files or source construction."""

from collections.abc import Sequence

from pipeline.sources import SourceDefinition, validate_registry


type UpdatePlan = list[list[str]]


def plan_update(selected: Sequence[str], registry: Sequence[SourceDefinition]) -> UpdatePlan:
    """Validate selection and expand registry relations into ordered name groups."""
    validate_registry(registry)
    names = [definition.name for definition in registry]
    unknown = set(selected) - set(names)
    if not selected or unknown:
        raise ValueError(f'Select known sources: {", ".join(names)}; unknown: {sorted(unknown)}')
    selected_set = set(selected)
    while True:
        expanded = selected_set | {
            definition.name for definition in registry
            if selected_set.intersection(definition.update_with)
        }
        if any(definition.includes_all and definition.name in selected_set for definition in registry):
            expanded.update(names)
        if expanded == selected_set:
            break
        selected_set = expanded
    groups = [[name] for name in names if name in selected_set]
    if any(definition.includes_all and definition.name in selected_set for definition in registry):
        groups = [[name for name in names if name in selected_set]]
    else:
        for definition in registry:
            if definition.name not in selected_set:
                continue
            for partner in definition.accept_with:
                if partner not in selected_set:
                    continue
                joined = {name for group in groups if definition.name in group or partner in group for name in group}
                position = next(index for index, group in enumerate(groups) if joined.intersection(group))
                groups = [group for group in groups if not joined.intersection(group)]
                groups.insert(position, [name for name in names if name in joined])
    group_index = {name: index for index, group in enumerate(groups) for name in group}
    for definition in registry:
        if definition.name not in selected_set:
            continue
        for dependency in definition.inputs.values():
            if dependency.source in selected_set and group_index[dependency.source] > group_index[definition.name]:
                raise ValueError(f'{definition.name}: joint acceptance conflicts with input producer order')
    return groups
