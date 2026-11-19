import sys

from pipeline.cli import main
from pipeline.registry import SOURCES

sys.exit(main(sys.argv[1:], sources=SOURCES))
