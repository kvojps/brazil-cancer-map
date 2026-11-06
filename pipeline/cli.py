"""Pipeline command line: `python -m pipeline run`."""

import argparse
import sys
import subprocess
from pathlib import Path
from collections.abc import Sequence

from pipeline.source import STEPS, Source
from pipeline.paths import CLEAN_DIR, REPO_DIR, SITE_DATA_DIR
from pipeline.release import export_release, publish_release, restore_release, export_state, restore_state

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
    run.add_argument("--year", type=int, help="partition HPV download/clean by year")
    update = sub.add_parser('update', help='prepare a local update for review, without changing live JSON')
    update.add_argument('--source', action='append', required=True)
    update.add_argument('--data-dir', type=Path, default=SITE_DATA_DIR)
    update.add_argument('--clean-dir', type=Path, default=CLEAN_DIR)
    update.add_argument('--output', type=Path, required=True)
    audit = sub.add_parser('hpv-audit', help='explicitly download, reduce or reconstruct local patient audit')
    audit.add_argument('--step', choices=('download', 'clean', 'compute'), required=True)
    audit.add_argument('--year', type=int)
    for command in ('export-release', 'release'):
        release = sub.add_parser(command, help='export open data' if command == 'export-release' else 'export and publish a data Release')
        release.add_argument('--data-dir', type=Path, default=SITE_DATA_DIR)
        release.add_argument('--state-dir', type=Path, help='include resumable clean state, excluding the HPV audit')
        release.add_argument('--output', type=Path, default=REPO_DIR / 'data' / 'release')
        if command == 'release':
            release.add_argument('version', help='version tag beginning with data-')
            release.add_argument('--repository', default='kvojps/brazil-cancer-map')
    restore = sub.add_parser('restore-release', help='rebuild site JSON from downloaded open data')
    restore.add_argument('--assets', type=Path, required=True)
    restore.add_argument('--output', type=Path, default=SITE_DATA_DIR)
    restore.add_argument('--format', choices=('csv', 'parquet'), default='parquet')
    state = sub.add_parser('restore-state', help='restore downloaded clean state to a new directory')
    state.add_argument('--assets', type=Path, required=True)
    state.add_argument('--output', type=Path, required=True)
    args = parser.parse_args(argv)
    if args.command != 'run':
        try:
            if args.command == 'update':
                from pipeline.update import update_sources
                return 0 if update_sources(args.source, args.data_dir, args.clean_dir, args.output) else 1
            if args.command == 'hpv-audit':
                from pipeline.sources.hpv import HpvSource
                if args.year is not None and args.step == 'compute':
                    raise ValueError('Audit compute requires the full history; omit --year')
                audit_source = HpvSource(years=(args.year,)) if args.year is not None else HpvSource()
                if args.step == 'download':
                    audit_source.download_audit()
                elif args.step == 'clean':
                    audit_source.clean()
                else:
                    audit_source.compute_audit()
            elif args.command == 'restore-state':
                restore_state(args.assets, args.output)
            elif args.command == 'restore-release':
                restore_release(args.assets, args.output, format=args.format)
            else:
                assets = export_release(args.data_dir, args.output)
                if args.state_dir is not None:
                    assets.extend(export_state(args.state_dir, args.output))
                if args.command == 'release':
                    publish_release(assets, args.version, repository=args.repository)
            return 0
        except (OSError, ValueError, subprocess.CalledProcessError) as error:
            print(f'{args.command} failed: {error}', file=sys.stderr)
            return 1
    if args.year is not None:
        if args.source != 'hpv' or args.step not in ('download', 'clean') or not 2020 <= args.year <= 2100:
            parser.error('--year requires --source hpv and --step download or clean')
        from pipeline.sources.hpv import HpvSource
        parser.error('Use hpv-audit --step download or clean --year for patient microdata')

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
