"""Prepare independently validated source updates for local review."""

import json
import shutil
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

from pipeline.source import STEPS
from pipeline.sources import SOURCE_DEFINITIONS, create_sources, validate_registry


def update_sources(selected: list[str], directory: Path, clean_dir: Path, output: Path) -> bool:
    """Leave live data untouched; retain only successful dependency groups in output."""
    registry = SOURCE_DEFINITIONS
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
    if output.exists() or output.resolve().is_relative_to(directory.resolve()) or output.resolve().is_relative_to(clean_dir.resolve()):
        raise ValueError('Update output must be a new directory outside the input directories')
    output.mkdir(parents=True)
    shutil.copytree(directory, output / 'dados')
    copy_state(clean_dir, output / 'clean')
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
    successful: list[str] = []
    failures: list[dict[str, object]] = []
    for group in groups:
        with tempfile.TemporaryDirectory(prefix='update-', dir=output) as temporary:
            work = Path(temporary)
            shutil.copytree(output / 'dados', work / 'dados')
            shutil.copytree(output / 'clean', work / 'clean')
            sources = {source.name: source for source in create_sources(work / 'clean', work / 'dados', registry=registry)}
            try:
                for name in group:
                    if name not in {'mesh', 'popsvs', 'inca'} and not (work / 'dados/municipalities.json').exists():
                        step = 'prepare'
                        raise ValueError('Municipal mesh must be published before updating indicators')
                    for step, execute in STEPS.items():
                        print(f'{name}: {step}', flush=True)
                        execute(sources[name])
            except Exception as error:
                message = f'{name}: {step} failed: {error}'
                print(message, file=sys.stderr, flush=True)
                failures.append({'sources': group, 'error': message})
                continue
            for folder in ('dados', 'clean'):
                shutil.rmtree(output / folder)
                shutil.copytree(work / folder, output / folder)
            successful.extend(group)
    (output / 'update.json').write_text(json.dumps({
        'attempted_at': datetime.now(UTC).isoformat(), 'selected': selected,
        'successful': successful, 'failures': failures,
    }, indent=2))
    return not failures


def copy_state(directory: Path, output: Path) -> None:
    """Copy resumable state, excluding patient extracts and optional HPV audit inputs."""
    validate_registry(SOURCE_DEFINITIONS)
    output.mkdir(parents=True, exist_ok=True)
    for definition in SOURCE_DEFINITIONS:
        folder = directory / definition.name
        if not folder.exists():
            continue
        if definition.name == 'hpv':
            target = output / 'hpv'
            target.mkdir()
            for name in ('official.json', 'census.parquet'):
                if (folder / name).is_file():
                    shutil.copy2(folder / name, target / name)
        else:
            shutil.copytree(folder, output / definition.name)
