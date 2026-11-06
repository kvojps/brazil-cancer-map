"""Prepare independently validated source updates for local review."""

import json
import shutil
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path

from pipeline.source import STEPS
from pipeline.sources import create_sources

POPULATION_USERS = {'siscan', 'siscan_cytopathology', 'sim'}


def update_sources(selected: list[str], directory: Path, clean_dir: Path, output: Path) -> bool:
    """Leave live data untouched; retain only successful dependency groups in output."""
    names = [source.name for source in create_sources()]
    unknown = set(selected) - set(names)
    if not selected or unknown:
        raise ValueError(f'Select known sources: {", ".join(names)}; unknown: {sorted(unknown)}')
    selected_set = set(selected)
    if 'mesh' in selected_set:
        selected_set.update(names)
    if 'popsvs' in selected_set:
        selected_set.update(POPULATION_USERS)
    if output.exists() or output.resolve().is_relative_to(directory.resolve()) or output.resolve().is_relative_to(clean_dir.resolve()):
        raise ValueError('Update output must be a new directory outside the input directories')
    output.mkdir(parents=True)
    shutil.copytree(directory, output / 'dados')
    copy_state(clean_dir, output / 'clean')
    groups = [[name] for name in names if name in selected_set]
    if 'mesh' in selected_set:
        groups = [[name for name in names if name in selected_set]]
    elif 'popsvs' in selected_set:
        groups = [['popsvs', *[name for name in names if name in POPULATION_USERS]],
                  *[group for group in groups if group[0] not in POPULATION_USERS | {'popsvs'}]]
    successful: list[str] = []
    failures: list[dict[str, object]] = []
    for group in groups:
        with tempfile.TemporaryDirectory(prefix='update-', dir=output) as temporary:
            work = Path(temporary)
            shutil.copytree(output / 'dados', work / 'dados')
            shutil.copytree(output / 'clean', work / 'clean')
            sources = {source.name: source for source in create_sources(work / 'clean', work / 'dados')}
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
    output.mkdir(parents=True, exist_ok=True)
    for source in create_sources():
        folder = directory / source.name
        if not folder.exists():
            continue
        if source.name == 'hpv':
            target = output / 'hpv'
            target.mkdir()
            for name in ('official.json', 'census.parquet'):
                if (folder / name).is_file():
                    shutil.copy2(folder / name, target / name)
        else:
            shutil.copytree(folder, output / source.name)
