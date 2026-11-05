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

SOURCES: list[Source] = [MeshSource(), PopsvsSource(), PainelSource(), CnesSource(), SiscanSource(), SiscanSource(indicator='cytopathology'), SimSource(), HpvSource(), IncaSource(), VigitelSource()]
"""The mesh comes first: health sources cover the municipalities it publishes."""
