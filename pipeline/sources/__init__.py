"""Source registry. Each new source is added to `SOURCES`, after the sources it reads from."""

from pipeline.source import Source
from pipeline.sources.mesh import MeshSource
from pipeline.sources.painel import PainelSource
from pipeline.sources.cnes import CnesSource

SOURCES: list[Source] = [MeshSource(), PainelSource(), CnesSource()]
"""The mesh comes first: health sources cover the municipalities it publishes."""
