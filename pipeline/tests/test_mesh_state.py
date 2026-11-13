"""Mesh state can travel without the original raw cache or network."""

import json
from pathlib import Path
import shutil
import socket
import tarfile

import pytest

from pipeline.cli import main
from pipeline.sources import create_sources
from pipeline.sources.mesh import MeshSource

FIXTURES = Path(__file__).parent / 'fixtures'


def documents(directory):
    return {p.relative_to(directory).as_posix(): json.loads(p.read_text())
            for p in directory.rglob('*') if p.suffix in ('.json', '.topojson')}


def prepare(tmp_path):
    raw = tmp_path / 'original/raw/mesh'
    raw.mkdir(parents=True)
    shutil.copyfile(FIXTURES / 'mesh-input.zip', raw / 'BR_Municipios_2025.zip')
    shutil.copyfile(FIXTURES / 'mesh-reference.json', raw / 'ibge_municipalities.json')
    clean = tmp_path / 'original/clean'
    site = tmp_path / 'original/dados'
    site.mkdir()
    reference = json.loads((FIXTURES / 'mesh-contract.json').read_text())
    (site / 'manifest.json').write_text(json.dumps(reference['manifest.json']))
    source = MeshSource(raw_dir=raw, clean_dir=clean / 'mesh', site_data_dir=site)
    for step in ('clean', 'compute', 'validate', 'export'):
        assert main(['run', '--source', 'mesh', '--step', step], [source]) == 0
    return raw, clean, site


def test_public_state_flow_reproduces_independent_mesh_contract_without_raw_or_network(tmp_path, monkeypatch):
    raw, clean, site = prepare(tmp_path)
    # Poison the cache after validation: the state must retain the reference actually used.
    (raw / 'ibge_municipalities.json').write_text('[]')
    (raw / 'unrelated-private-extract.csv').write_text('never package raw inputs')
    (clean / 'hpv/months').mkdir(parents=True)
    (clean / 'hpv/months/patients.parquet').write_bytes(b'private audit')
    (clean / 'hpv/audit.json').write_text('{}')
    assets = tmp_path / 'assets'
    assert main(['export-release', '--data-dir', str(site), '--state-dir', str(clean),
                 '--output', str(assets)], []) == 0
    with tarfile.open(assets / 'state-mesh.tar.gz') as archive:
        assert {m.name for m in archive.getmembers() if m.isfile()} == {
            'mesh/municipalities.json', 'mesh/municipalities.topojson',
            'mesh/ibge_municipalities.json'}
    shutil.rmtree(tmp_path / 'original')

    def deny_network(*args, **kwargs):
        pytest.fail('restored mesh must not access the network')

    monkeypatch.setattr(socket, 'create_connection', deny_network)
    monkeypatch.setattr(socket.socket, 'connect', deny_network)
    restored = tmp_path / 'researcher/clean'
    produced = tmp_path / 'researcher/dados'
    assert main(['restore-state', '--assets', str(assets), '--output', str(restored)], []) == 0
    assert main(['restore-release', '--assets', str(assets), '--output', str(produced)], []) == 0
    assert not (restored / 'hpv/months').exists()
    assert not (restored / 'hpv/audit.json').exists()
    # Use the registry, exactly as the CLI does, with only the restored directories.
    sources = create_sources(restored, produced)
    for step in ('compute', 'validate', 'export'):
        assert main(['run', '--source', 'mesh', '--step', step], sources) == 0
    expected = json.loads((FIXTURES / 'mesh-contract.json').read_text())
    assert json.dumps(documents(produced), sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.parametrize('reference', [None, 'not JSON', '[]', '[{}]',
                                     '[{"id":4314407,"regiao-imediata":{"id":430099}}]'])
def test_invalid_snapshot_reference_never_uses_raw_fallback_or_replaces_valid_contract(tmp_path, reference):
    _, clean, site = prepare(tmp_path)
    before = documents(site)
    path = clean / 'mesh/ibge_municipalities.json'
    if reference is None:
        path.unlink(missing_ok=True)
    else:
        path.write_text(reference)
    sources = create_sources(clean, site)
    for step in ('validate', 'export'):
        assert main(['run', '--source', 'mesh', '--step', step], sources) == 1
    assert documents(site) == before


def test_update_snapshot_retains_mesh_reference_and_isolates_it_from_input(tmp_path):
    raw, clean, site = prepare(tmp_path)
    before = documents(site)
    reference = (clean / 'mesh/ibge_municipalities.json').read_bytes()
    proposal = tmp_path / 'proposal'
    # INCA uses a versioned input and can update independently of the mesh.
    assert main(['update', '--source', 'inca', '--data-dir', str(site),
                 '--clean-dir', str(clean), '--output', str(proposal)], []) == 0
    assert documents(site) == before
    assert (clean / 'mesh/ibge_municipalities.json').read_bytes() == reference
    assert (proposal / 'clean/mesh/ibge_municipalities.json').read_bytes() == reference
    (raw / 'ibge_municipalities.json').write_text('[]')
    (clean / 'mesh/ibge_municipalities.json').write_text('[]')
    sources = create_sources(proposal / 'clean', proposal / 'dados')
    for step in ('compute', 'validate', 'export'):
        assert main(['run', '--source', 'mesh', '--step', step], sources) == 0
    assert json.loads((proposal / 'dados/municipalities.json').read_text()) == before['municipalities.json']


def test_mesh_state_asset_respects_size_limit(tmp_path, monkeypatch):
    _, clean, site = prepare(tmp_path)
    monkeypatch.setattr('pipeline.release.MAX_ASSET_BYTES', 1)
    assert main(['export-release', '--data-dir', str(site), '--state-dir', str(clean),
                 '--output', str(tmp_path / 'assets')], []) == 1


def test_failed_mesh_update_preserves_entire_dependency_group(tmp_path, monkeypatch):
    _, clean, site = prepare(tmp_path)
    before_site = documents(site)
    before_state = {p.relative_to(clean): p.read_bytes() for p in clean.rglob('*') if p.is_file()}

    def unavailable_transport(url):
        raise OSError('fixture: IBGE is unavailable')

    monkeypatch.setattr('pipeline.download.transport_for', unavailable_transport)
    proposal = tmp_path / 'failed-proposal'
    assert main(['update', '--source', 'mesh', '--data-dir', str(site),
                 '--clean-dir', str(clean), '--output', str(proposal)], []) == 1
    report = json.loads((proposal / 'update.json').read_text())
    assert report['successful'] == []
    assert report['failures'][0]['sources'] == [s.name for s in create_sources()]
    assert 'mesh: download failed' in report['failures'][0]['error']
    assert documents(site) == documents(proposal / 'dados') == before_site
    for directory in (clean, proposal / 'clean'):
        assert {p.relative_to(directory): p.read_bytes()
                for p in directory.rglob('*') if p.is_file()} == before_state
