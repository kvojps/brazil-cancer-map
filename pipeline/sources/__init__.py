"""Source registry. Each new source is added to `SOURCES`, after the sources it reads from."""

from pipeline.source import Source
from pipeline.sources.inca import IncaSource
from pipeline.sources.hpv import HpvSource
from pipeline.sources.mesh import MeshSource
from pipeline.sources.painel import PainelSource
from pipeline.sources.cnes import CnesSource
from pipeline.sources.popsvs import PopsvsSource
from pipeline.sources.siscan import SiscanSource
from pipeline.sources.sim import SimSource
from pipeline.sources.vigitel import VigitelSource

from pathlib import Path
from pipeline.paths import CLEAN_DIR, SITE_DATA_DIR


def create_sources(clean_dir: Path = CLEAN_DIR, site_data_dir: Path = SITE_DATA_DIR) -> list[Source]:
    """Bind sources and their population dependencies to one working snapshot."""
    population = clean_dir / 'popsvs/population.parquet'
    return [
        MeshSource(clean_dir=clean_dir / 'mesh', site_data_dir=site_data_dir),
        PopsvsSource(clean_dir=clean_dir / 'popsvs'),
        PainelSource(clean_dir=clean_dir / 'painel', site_data_dir=site_data_dir),
        CnesSource(clean_dir=clean_dir / 'cnes', site_data_dir=site_data_dir),
        SiscanSource(clean_dir=clean_dir / 'siscan', site_data_dir=site_data_dir, population_path=population),
        SiscanSource(indicator='cytopathology', clean_dir=clean_dir / 'siscan_cytopathology',
                     site_data_dir=site_data_dir, population_path=population),
        SimSource(clean_dir=clean_dir / 'sim', site_data_dir=site_data_dir, population_path=population),
        HpvSource(clean_dir=clean_dir / 'hpv', site_data_dir=site_data_dir),
        IncaSource(site_data_dir=site_data_dir),
        VigitelSource(clean_dir=clean_dir / 'vigitel', site_data_dir=site_data_dir),
    ]


SOURCES = create_sources()
