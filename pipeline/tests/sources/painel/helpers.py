"""Painel inputs shared by the Painel tests."""

import json
import os

from pipeline.cli import main
from pipeline.sources.painel import PainelSource

YEARS = range(2014, 2027)


def record(cid="C50", year="2020", municipality="261160", treatment="2", days="+0030", month="03"):
    """One Painel-Oncologia row, with the fields as `dbfread` yields them."""
    return {
        "ANO_DIAGN": year,
        "ANOMES_DIA": year + month,
        "MUN_RESID": municipality,
        "DIAG_DETH": cid,
        "TRATAMENTO": treatment,
        "TEMPO_TRAT": days,
    }


def tabnet_page(rows):
    """A TabNet result page as `webtabx.exe` returns it, trimmed to the table script."""
    lines = ",\n".join(
        f'["{uf}" ,{{v: {a}.0 ,f: \'{a}\'}} ,{{v: {b}.0 ,f: \'{b}\'}} ,{{v: {c}.0 ,f: \'{c}\'}} '
        f",{{v: {d}.0 ,f: '{d}'}} ,{{v: {a + b + c + d}.0 ,f: '{a + b + c + d}'}} ]"
        for uf, (a, b, c, d) in rows.items()
    )
    return f"""<html><script>
        data.addColumn('string','UF da residência');
        data.addColumn('number','Até 30 dias');
        data.addColumn('number','31 - 60 dias');
        data.addColumn('number','Mais de 60');
        data.addColumn('number','Sem informação de tratamento');
        data.addColumn('number',' Total');
        data.addRows([
{lines}
        ]);
</script></html>"""


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
    monkeypatch.setattr('pipeline.sources.painel.source.read_dbc', decode)
    source = PainelSource(raw_dir=raw, clean_dir=clean / 'painel', site_data_dir=site)
    for step in ('clean', 'compute', 'validate', 'export'):
        assert main(['run', '--source', 'painel', '--step', step], [source]) == 0
    return raw, clean, site
