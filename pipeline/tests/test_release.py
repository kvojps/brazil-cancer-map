"""Open data can rebuild the published contract without source inputs."""

import csv
import json
from pathlib import Path

import pytest

from pipeline.release import export_release, restore_release


@pytest.mark.parametrize('format', ['csv', 'parquet'])
def test_release_rebuilds_every_contract_file_with_source_and_period(tmp_path, format):
    original = tmp_path / 'original'
    (original / 'profiles').mkdir(parents=True)
    source = {'name': 'Original source', 'url': 'https://example.org', 'conditions': 'Cite original source'}
    block = {'source': source, 'period': {'first_year': 2020, 'last_year': 2024},
             'municipalities': {'120001': {'value': 45.5, 'trend': None}},
             'series': [{'year': 2020, 'value': 0}], 'empty': []}
    documents = {'manifest.json': {'indicators': {'example': {'all': block['period']}}},
                 'profiles/AC.json': {'uf': 'AC', 'indicators': {'example': {'all': block}}},
                 'municipalities.topojson': {'type': 'Topology', 'arcs': [[[0, 1], [-1, 2]]]},
                 'municipalities.json': [{'code': '120001', 'name': 'Acrelândia'}]}
    for name, document in documents.items():
        (original / name).write_text(json.dumps(document))
    assets = export_release(original, tmp_path / 'release')
    assert {p.name for p in assets} == {'example.csv', 'example.parquet', 'contract.csv', 'contract.parquet'}
    with (tmp_path / 'release/example.csv').open() as stream:
        row = next(csv.DictReader(stream))
    assert 'Original source' in row['source']
    assert '2024' in row['period']
    assert 'Cite original source' in row['conditions']
    assert 'fontes originais' in row['citation']
    restored = tmp_path / 'restored'
    restore_release(tmp_path / 'release', restored, format=format)
    assert {str(p.relative_to(restored)): json.loads(p.read_text()) for p in restored.rglob('*') if p.is_file()} == documents


def test_cli_publishes_versioned_assets_and_rejects_oversized_files(tmp_path, monkeypatch):
    from pipeline.cli import main
    from pipeline.release import publish_release

    data = tmp_path / 'data'
    data.mkdir()
    (data / 'manifest.json').write_text('{"sources":{},"indicators":{}}')
    commands = []
    monkeypatch.setattr('subprocess.run', lambda command, **kwargs: commands.append(command))
    assert main(['release', 'data-2026-11', '--data-dir', str(data), '--output', str(tmp_path / 'assets'),
                 '--repository', 'owner/repo'], []) == 0
    command, = commands
    assert command[:4] == ['gh', 'release', 'create', 'data-2026-11']
    assert '--latest' in command
    assert str(tmp_path / 'assets/contract.csv') in command
    assert str(tmp_path / 'assets/contract.parquet') in command
    large = tmp_path / 'large.csv'
    with large.open('wb') as stream:
        stream.truncate(2 * 1024**3)
    with pytest.raises(ValueError, match='2 GiB'):
        publish_release([large], 'data-2026-11', repository='owner/repo')
    assert len(commands) == 1


def test_all_published_indicators_can_rebuild_the_complete_site_contract(tmp_path):
    from pipeline.paths import SITE_DATA_DIR

    assets = tmp_path / 'assets'
    export_release(SITE_DATA_DIR, assets)
    original = {p.relative_to(SITE_DATA_DIR): json.loads(p.read_text())
                for p in SITE_DATA_DIR.rglob('*') if p.suffix in ('.json', '.topojson')}
    for format in ('csv', 'parquet'):
        restored = tmp_path / format
        restore_release(assets, restored, format=format)
        assert {p.relative_to(restored): json.loads(p.read_text())
                for p in restored.rglob('*') if p.is_file()} == original
