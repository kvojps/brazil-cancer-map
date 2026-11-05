"""Lossless tabular exports of the public data contract, without recomputation."""

import csv
import json
import re
import subprocess
from contextlib import ExitStack
from pathlib import Path
from typing import Any

import duckdb

COLUMNS = ('file', 'path', 'value', 'source', 'period', 'conditions', 'citation')
CITATION = 'Ao citar o Observatório do Câncer no Brasil, cite também as fontes originais.'
MAX_ASSET_BYTES = 2 * 1024**3


def export_release(directory: Path, output: Path) -> list[Path]:
    """Export every contract value, grouped by indicator, in CSV and Parquet.

    Paths are JSON arrays of object keys and integer array indexes. Values are
    JSON records, arrays or scalars; this preserves nulls, types and nesting.
    Source metadata is recorded on the first row for each source and period in each table.
    """
    manifest = json.loads((directory / 'manifest.json').read_text())
    output.mkdir(parents=True, exist_ok=True)
    writers: dict[str, Any] = {}
    assets: list[Path] = []
    metadata_seen: set[tuple[str, str, str]] = set()
    with ExitStack() as stack:
        def write(group: str, file: str, path: list[str | int], value: Any,
                  source: Any, period: Any) -> None:
            if not re.fullmatch(r'[a-z][a-z0-9_]*', group):
                raise ValueError(f'Invalid indicator name: {group}')
            if group not in writers:
                asset = output / f'{group}.csv'
                writer = csv.writer(stack.enter_context(asset.open('w', newline='', encoding='utf-8')))
                writer.writerow(COLUMNS)
                writers[group] = writer
                assets.append(asset)
            conditions = source.get('conditions') if isinstance(source, dict) else None
            encoded_source = json.dumps(source, ensure_ascii=False)
            encoded_period = json.dumps(period, ensure_ascii=False)
            metadata_key = (group, encoded_source, encoded_period)
            first = metadata_key not in metadata_seen
            metadata_seen.add(metadata_key)
            writers[group].writerow((file, json.dumps(path), json.dumps(value, ensure_ascii=False),
                                     encoded_source if first else '', encoded_period if first else '',
                                     (conditions or 'Dados de terceiros; consulte as condições de cada fonte na metodologia. '
                                      'A licença do código não se aplica aos dados. IBGE: citar a fonte.') if first else '',
                                     CITATION if first else ''))

        def walk(value: Any, path: list[str | int], group: str, file: str,
                 source: Any, period: Any) -> None:
            if isinstance(value, dict) and value and any(isinstance(child, (dict, list)) for child in value.values()):
                for key, child in value.items():
                    if path == ['indicators'] and file.startswith('profiles/'):
                        # Each profile indicator carries its own source and period per cancer type.
                        for cancer, block in child.items():
                            walk(block, [*path, key, cancer], key, file,
                                 block['source'], block.get('period', manifest['indicators'][key][cancer]))
                    elif not path and key == 'where_to_treat':
                        walk(child, [key], key, file, child['source'], child['period'])
                    else:
                        walk(child, [*path, key], group, file, source, period)
            else:
                write(group, file, path, value, source, period)

        for file in sorted(directory.rglob('*')):
            if file.suffix not in ('.json', '.topojson'):
                continue
            document = json.loads(file.read_text())
            name = file.relative_to(directory).as_posix()
            is_map = name.startswith('map/')
            walk(document, [], document['indicator'] if is_map else 'contract', name,
                 document.get('source', {'name': 'IBGE e fontes dos indicadores', 'url': 'https://github.com/kvojps/brazil-cancer-map', 'conditions': 'Dados públicos de terceiros, com citação das fontes originais. Condições específicas no manifesto e nas tabelas dos indicadores; a licença do código não se aplica.'}) if isinstance(document, dict) else {},
                 document.get('period', manifest.get('indicators', {})) if isinstance(document, dict) else {})
    with duckdb.connect() as connection:
        for asset in list(assets):
            parquet = asset.with_suffix('.parquet')
            connection.read_csv(str(asset), all_varchar=True, max_line_size=64 * 1024**2).write_parquet(str(parquet), compression='zstd')
            assets.append(parquet)
    return assets


def restore_release(assets: Path, directory: Path, *, format: str = 'parquet') -> None:
    """Rebuild JSON from either complete set of downloaded release tables."""
    if format not in ('csv', 'parquet'):
        raise ValueError('Format must be csv or parquet')
    documents: dict[str, Any] = {}
    files = sorted(assets.glob(f'*.{format}'))
    if not files:
        raise ValueError('No release tables found')
    with duckdb.connect() as connection:
        for file in files:
            relation = (connection.read_parquet(str(file)) if format == 'parquet'
                        else connection.read_csv(str(file), all_varchar=True, max_line_size=64 * 1024**2))
            cursor = connection.execute('SELECT file, path, value FROM relation')
            while rows := cursor.fetchmany(10000):
                for name, encoded_path, encoded_value in rows:
                    path = json.loads(encoded_path)
                    value = json.loads(encoded_value)
                    if not path:
                        documents[name] = value
                        continue
                    node = documents.setdefault(name, [] if isinstance(path[0], int) else {})
                    for index, key in enumerate(path):
                        last = index == len(path) - 1
                        child = value if last else ([] if isinstance(path[index + 1], int) else {})
                        if isinstance(node, list):
                            while len(node) <= key:
                                node.append(None)
                            if last or node[key] is None:
                                node[key] = child
                        elif last:
                            node[key] = child
                        else:
                            node.setdefault(key, child)
                        node = node[key]
    for name, document in documents.items():
        dest = directory / name
        if not dest.resolve().is_relative_to(directory.resolve()):
            raise ValueError(f'Unsafe contract path: {name}')
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(document, ensure_ascii=False, separators=(',', ':')))


def publish_release(assets: list[Path], version: str, *, repository: str) -> None:
    """Create a versioned data Release through the authenticated GitHub CLI."""
    if not re.fullmatch(r'data-[A-Za-z0-9][A-Za-z0-9._-]*', version):
        raise ValueError('Data release version must start with data-')
    if not assets or any(asset.stat().st_size >= MAX_ASSET_BYTES for asset in assets):
        raise ValueError('Release requires assets smaller than 2 GiB each')
    subprocess.run(['gh', 'release', 'create', version, '--repo', repository,
                    '--title', f'Dados — {version}', '--notes',
                    'Agregados completos em CSV e Parquet. ' + CITATION,
                    '--latest', *map(str, assets)], check=True)
