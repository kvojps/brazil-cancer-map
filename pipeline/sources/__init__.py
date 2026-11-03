"""Source registry. Each new source is added to `SOURCES`, after the sources it reads from."""

from pipeline.source import Source
from pipeline.sources.mesh import MeshSource
from pipeline.sources.painel import PainelSource

SOURCES: list[Source] = [MeshSource(), PainelSource()]
"""The mesh comes first: the Painel layers cover the municipalities it publishes."""
