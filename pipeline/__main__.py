import sys

from pipeline.cli import main
from pipeline.fontes import FONTES

sys.exit(main(sys.argv[1:], fontes=FONTES))
