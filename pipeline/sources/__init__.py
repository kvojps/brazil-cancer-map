"""Ordered source definitions and factories bound to one working snapshot."""

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path

from pipeline.paths import CLEAN_DIR, SITE_DATA_DIR
from pipeline.source import Source
from pipeline.sources.cnes import CnesSource
from pipeline.sources.hpv import HpvSource
from pipeline.sources.inca import IncaSource
from pipeline.sources.mesh import MeshSource
from pipeline.sources.painel import PainelSource
from pipeline.sources.popsvs import PopsvsSource
from pipeline.sources.sim import SimSource
from pipeline.sources.siscan import SiscanSource
from pipeline.sources.vigitel import VigitelSource


@dataclass(frozen=True)
class SourceInput:
    """A named factory argument read from a producer's clean state."""

    source: str
    path: str


SourceFactory = Callable[[Path, Path, Mapping[str, Path]], Source]


@dataclass(frozen=True)
class SourceDefinition:
    """Construction, consumption, update triggers and joint acceptance are distinct."""

    name: str
    factory: SourceFactory
    inputs: Mapping[str, SourceInput] = field(default_factory=dict)
    update_with: tuple[str, ...] = ()
    accept_with: tuple[str, ...] = ()
    includes_all: bool = False


SOURCE_DEFINITIONS = (
    SourceDefinition('mesh', lambda clean, data, inputs: MeshSource(clean_dir=clean, site_data_dir=data),
                     includes_all=True),
    SourceDefinition('popsvs', lambda clean, data, inputs: PopsvsSource(clean_dir=clean)),
    SourceDefinition('painel', lambda clean, data, inputs: PainelSource(clean_dir=clean, site_data_dir=data)),
    SourceDefinition('cnes', lambda clean, data, inputs: CnesSource(clean_dir=clean, site_data_dir=data)),
    SourceDefinition('siscan', lambda clean, data, inputs: SiscanSource(
        clean_dir=clean, site_data_dir=data, population_path=inputs['population_path']),
                     inputs={'population_path': SourceInput('popsvs', 'population.parquet')},
                     update_with=('popsvs',), accept_with=('popsvs',)),
    SourceDefinition('siscan_cytopathology', lambda clean, data, inputs: SiscanSource(
        indicator='cytopathology', clean_dir=clean, site_data_dir=data, population_path=inputs['population_path']),
        inputs={'population_path': SourceInput('popsvs', 'population.parquet')},
        update_with=('popsvs',), accept_with=('popsvs',)),
    SourceDefinition('sim', lambda clean, data, inputs: SimSource(
        clean_dir=clean, site_data_dir=data, population_path=inputs['population_path']),
                     inputs={'population_path': SourceInput('popsvs', 'population.parquet')},
                     update_with=('popsvs',), accept_with=('popsvs',)),
    SourceDefinition('hpv', lambda clean, data, inputs: HpvSource(clean_dir=clean, site_data_dir=data)),
    SourceDefinition('inca', lambda clean, data, inputs: IncaSource(site_data_dir=data)),
    SourceDefinition('vigitel', lambda clean, data, inputs: VigitelSource(clean_dir=clean, site_data_dir=data)),
)


def validate_registry(registry: Sequence[SourceDefinition]) -> None:
    """Reject invalid definitions before factories or output creation can run."""
    names = [definition.name for definition in registry]
    if len(set(names)) != len(names):
        raise ValueError('Duplicate source names')
    previous: set[str] = set()
    for definition in registry:
        if not definition.name or Path(definition.name).name != definition.name or definition.name in {'.', '..'}:
            raise ValueError(f'Invalid source name: {definition.name}')
        references = {dependency.source for dependency in definition.inputs.values()}
        references.update(definition.update_with)
        references.update(definition.accept_with)
        if unknown := references - set(names):
            raise ValueError(f'{definition.name}: unknown sources: {sorted(unknown)}')
        if unordered := references - previous:
            raise ValueError(f'{definition.name}: dependencies must precede consumer: {sorted(unordered)}')
        for dependency in definition.inputs.values():
            path = Path(dependency.path)
            if path.is_absolute() or '..' in path.parts:
                raise ValueError(f'{definition.name}: input must stay inside producer state')
        previous.add(definition.name)


def create_sources(clean_dir: Path = CLEAN_DIR, site_data_dir: Path = SITE_DATA_DIR, *,
                   registry: Sequence[SourceDefinition] = SOURCE_DEFINITIONS) -> list[Source]:
    """Build sources with named input paths from the same working snapshot."""
    validate_registry(registry)
    return [definition.factory(
        clean_dir / definition.name, site_data_dir,
        {argument: clean_dir / dependency.source / dependency.path
         for argument, dependency in definition.inputs.items()},
    ) for definition in registry]


SOURCES = create_sources()
