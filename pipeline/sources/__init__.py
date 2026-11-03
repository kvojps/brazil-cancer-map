"""Source registry. Each new source is added to `SOURCES`."""

from pipeline.source import Source
from pipeline.sources.mesh import MeshSource

SOURCES: list[Source] = [MeshSource()]
