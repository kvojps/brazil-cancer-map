import sys

from pipeline.cli import main
from pipeline.sources import SOURCES

sys.exit(main(sys.argv[1:], sources=SOURCES))
