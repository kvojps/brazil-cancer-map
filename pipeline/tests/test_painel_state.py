"""Treatment state reproduces its contract without raw inputs or network."""

import json
import os
from pathlib import Path
import shutil
import socket
import tarfile

import pytest

from pipeline.cli import main
from pipeline.sources import create_sources
from pipeline.sources.painel import PainelSource
from pipeline.tests.test_painel_clean import record
from pipeline.tests.test_painel_validate import tabnet_page

FIXTURES = Path(__file__).parent / 'fixtures'
YEARS = range(2014, 2027)


def documents(directory):
    return {p.relative_to(directory).as_posix(): json.loads(p.read_text())
            for p in directory.rglob('*.json')}


def prepare(tmp_path, monkeypatch):
    raw = tmp_path / 'original/raw/painel'
    clean = tmp_path / 'original/clean'
    site = tmp_path / 'original/dados'
    (raw / 'tabnet/chemo_radio').mkdir(parents=True)
    site.mkdir(parents=True)
    listing = {'municipalities': [{'code': '110020', 'name': 'Porto Velho',
                                 'uf': 'RO', 'immediate_region': '110001'}]}
    (site / 'municipalities.json').write_text(json.dumps(listing))
    for year in YEARS:
        dbc = raw / f'POBR{year}.dbc'
        dbc.write_bytes(b'decoder fixture')
        os.utime(dbc, (1792195200, 1792195200))  # 2026-10-17 UTC
        for folder, values in (('', (600, 0, 300, 100)), ('chemo_radio', (200, 0, 300, 0))):
            (raw / 'tabnet' / folder / f'{year}.html').write_bytes(
                tabnet_page({'11 Rondônia': values}).encode('latin-1'))
    (raw / 'tabnet/1999.html').write_text('unrelated cached year')
    (raw / 'tabnet/private.csv').write_text('unrelated raw extract')
    # The external DBC decoder is the only simulated adapter; cleaning, statistics,
    # official comparisons, snapshots and the CLI all execute normally.
    def decode(path):
        year = path.stem[4:]
        for cid in ('C50', 'C53', 'C61', 'C18', 'C34'):
            for treatment, days, count in (('1', '+0010', 80), ('2', '+0030', 40),
                                           ('3', '+0090', 60), ('5', '', 20)):
                for _ in range(count):
                    yield record(cid=cid, year=year, municipality='110020', treatment=treatment, days=days)
    monkeypatch.setattr('pipeline.sources.painel._read_dbc', decode)
    source = PainelSource(raw_dir=raw, clean_dir=clean / 'painel', site_data_dir=site)
    for step in ('clean', 'compute', 'validate', 'export'):
        assert main(['run', '--source', 'painel', '--step', step], [source]) == 0
    return raw, clean, site


def test_public_state_flow_reproduces_independent_treatment_contract(tmp_path, monkeypatch):
    raw, clean, site = prepare(tmp_path, monkeypatch)
    # Cached pages can change later; only the pages preserved by clean belong to this state.
    for page in (raw / 'tabnet').rglob('*.html'):
        page.write_text('later cache contents')
    (raw / 'tabnet/1999.html').write_text('unrelated page')
    (raw / 'patients.csv').write_text('private extract')
    (clean / 'hpv/months').mkdir(parents=True)
    (clean / 'hpv/months/patients.parquet').write_bytes(b'private audit')
    assets = tmp_path / 'assets'
    assert main(['export-release', '--data-dir', str(site), '--state-dir', str(clean),
                 '--output', str(assets)], []) == 0
    with tarfile.open(assets / 'state-painel.tar.gz') as archive:
        pages = {m.name for m in archive.getmembers() if m.isfile() and m.name.endswith('.html')}
        assert pages == {f'painel/tabnet/{folder}{year}.html'
                         for folder in ('', 'chemo_radio/') for year in YEARS}
        assert not any('patients' in m.name or m.name.endswith('.dbc') for m in archive.getmembers())
    shutil.rmtree(tmp_path / 'original')

    def deny_network(*args, **kwargs):
        pytest.fail('restored treatment must not access the network')
    monkeypatch.setattr(socket, 'create_connection', deny_network)
    monkeypatch.setattr(socket.socket, 'connect', deny_network)
    restored = tmp_path / 'researcher/clean'
    produced = tmp_path / 'researcher/dados'
    assert main(['restore-state', '--assets', str(assets), '--output', str(restored)], []) == 0
    assert main(['restore-release', '--assets', str(assets), '--output', str(produced)], []) == 0
    assert not (restored / 'hpv/months').exists()
    sources = create_sources(restored, produced)
    for step in ('compute', 'validate', 'export'):
        assert main(['run', '--source', 'painel', '--step', step], sources) == 0
    expected = json.loads((FIXTURES / 'painel-contract.json').read_text())
    actual = documents(produced)
    # Code identity legitimately changes as this regression test is committed.
    assert actual['manifest.json']['pipeline_version']
    actual['manifest.json']['pipeline_version'] = expected['manifest.json']['pipeline_version']
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)


@pytest.mark.parametrize('folder', ['', 'chemo_radio'])
@pytest.mark.parametrize('page', [None, 'not a TabNet page', 'empty', 'mismatch'])
def test_invalid_state_page_blocks_validation_and_preserves_contract(tmp_path, monkeypatch, folder, page):
    _, clean, site = prepare(tmp_path, monkeypatch)
    before = documents(site)
    path = clean / 'painel/tabnet' / folder / '2020.html'
    if page is None:
        path.unlink()
    elif page == 'empty':
        path.write_text(tabnet_page({}))
    elif page == 'mismatch':
        path.write_text(tabnet_page({'11 Rondônia': (1, 0, 999, 0)}))
    else:
        path.write_text(page)
    # The original raw pages remain valid; no fallback may hide a damaged state.
    sources = create_sources(clean, site)
    for step in ('validate', 'export'):
        assert main(['run', '--source', 'painel', '--step', step], sources) == 1
    assert documents(site) == before


def test_update_snapshot_isolates_treatment_pages_and_failure_preserves_previous_state(tmp_path, monkeypatch):
    _, clean, site = prepare(tmp_path, monkeypatch)
    before_site = documents(site)
    before_state = {p.relative_to(clean): p.read_bytes() for p in clean.rglob('*') if p.is_file()}
    proposal = tmp_path / 'proposal'
    assert main(['update', '--source', 'inca', '--data-dir', str(site),
                 '--clean-dir', str(clean), '--output', str(proposal)], []) == 0
    assert (proposal / 'clean/painel/tabnet/2020.html').read_bytes() == before_state[Path('painel/tabnet/2020.html')]
    (clean / 'painel/tabnet/2020.html').write_text('changed original state')
    sources = create_sources(proposal / 'clean', proposal / 'dados')
    for step in ('compute', 'validate', 'export'):
        assert main(['run', '--source', 'painel', '--step', step], sources) == 0
    assert documents(site) == before_site

    def unavailable_ftp(directory):
        raise OSError('fixture: DATASUS is unavailable')
    monkeypatch.setattr('pipeline.sources.painel.list_ftp', unavailable_ftp)
    failed = tmp_path / 'failed'
    assert main(['update', '--source', 'painel', '--data-dir', str(proposal / 'dados'),
                 '--clean-dir', str(proposal / 'clean'), '--output', str(failed)], []) == 1
    report = json.loads((failed / 'update.json').read_text())
    assert report['successful'] == []
    assert report['failures'][0]['sources'] == ['painel']
    assert 'painel: download failed' in report['failures'][0]['error']
    assert documents(failed / 'dados') == documents(proposal / 'dados')
    for directory in (failed / 'clean', proposal / 'clean'):
        assert {p.relative_to(directory): p.read_bytes()
                for p in directory.rglob('*') if p.is_file()} == before_state


def test_treatment_state_asset_respects_size_limit(tmp_path, monkeypatch):
    _, clean, site = prepare(tmp_path, monkeypatch)
    monkeypatch.setattr('pipeline.release.MAX_ASSET_BYTES', 1)
    assert main(['export-release', '--data-dir', str(site), '--state-dir', str(clean),
                 '--output', str(tmp_path / 'assets')], []) == 1
