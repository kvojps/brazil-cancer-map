"""Pipeline command line: `python -m pipeline run`."""

import argparse
import sys
from collections.abc import Sequence

from pipeline.source import STEPS, Source

STEP_ORDER = " → ".join(STEPS)


def main(argv: Sequence[str], sources: Sequence[Source]) -> int:
    """Run the pipeline steps over the given sources and return the exit code."""
    parser = argparse.ArgumentParser(prog="python -m pipeline")
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser(
        "run",
        help="run the pipeline",
        description=f"Steps, in order: {STEP_ORDER}.",
    )
    run.add_argument("--source", help="run only this source")
    run.add_argument("--step", choices=list(STEPS), help="run only this step")
    run.add_argument("--list", action="store_true", help="show steps and sources without running")
    args = parser.parse_args(argv)

    names = [s.name for s in sources]

    if args.list:
        print(f"Steps: {STEP_ORDER}")
        print("Sources: " + (", ".join(names) or "none registered"))
        return 0

    if args.source is not None:
        if args.source not in names:
            parser.error(
                f"unknown source: {args.source!r} (available: {', '.join(names) or 'none'})"
            )
        sources = [s for s in sources if s.name == args.source]

    steps = list(STEPS) if args.step is None else [args.step]

    failed = False
    for source in sources:
        for step in steps:
            print(f"{source.name}: {step}")
            try:
                STEPS[step](source)
            except Exception as error:
                # A failed step stops that source; nothing from it moves on (spec, section 14).
                print(f"{source.name}: {step} failed: {error}", file=sys.stderr)
                failed = True
                break
    return 1 if failed else 0
