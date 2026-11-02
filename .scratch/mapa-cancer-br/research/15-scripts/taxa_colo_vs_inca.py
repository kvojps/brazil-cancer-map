# Compara a taxa padronizada de colo do útero do pipeline com a do INCA (dados e números 2025, ano 2022).
# Uso: python taxa_colo_vs_inca.py 2022,2023,2024  (lê sim.pkl e pop/POP<aa>.dbf do POPSVS)
import sys, glob, dbfread, pandas as pd, numpy as np
sim = pd.read_pickle('sim.pkl'); sim['idade'] = sim.idade.astype(int)
SEGI = [12000,10000,9000,9000,8000,8000,6000,6000,6000,6000,5000,4000,4000,3000,2000,1000,1000]  # 0-4..75-79, 80+
def g5(a): return np.minimum(a // 5, 16)
G11 = [0,1,2,3,4,4,5,5,6,6,7,7,8,8,9,9,10]  # quinquenal -> 0-4,5-9,10-14,15-19,20-29,...,70-79,80+
W11 = pd.Series(SEGI).groupby(G11).sum().values
def pop(ano):
    f = glob.glob(f'pop/*{ano[2:]}.dbf') + glob.glob(f'pop/*{ano[2:]}.DBF')
    p = pd.DataFrame(iter(dbfread.DBF(f[0]))); p.columns = [c.lower() for c in p.columns]
    p = p[p.sexo.astype(str).eq('2')].copy(); p['uf'] = p.cod_mun.str[:2]; p['g'] = g5(p.idade.astype(int))
    return p.groupby(['uf','g']).pop.sum()
def adj(d, p, scheme):
    r = (d / p).fillna(0)
    if scheme == 5: return (r * SEGI).sum() / sum(SEGI) * 1e5
    dd = d.groupby(G11).sum(); pp = p.groupby(G11).sum(); return ((dd / pp) * W11).sum() / W11.sum() * 1e5
for ano in sys.argv[1].split(','):
    P = pop(ano)
    s = sim[(sim.ano == ano) & (sim.sexo == '2') & (sim.idade >= 0)].copy()
    s['uf'] = s.mun.str[:2]; s['g'] = g5(s.idade)
    c = s[s.cid.isin(['C53','C54','C55'])].pivot_table(index=['uf','g'], columns='cid', values='n', aggfunc='sum', fill_value=0)
    c = c.reindex(P.index, fill_value=0)
    # redistribuição proporcional do C55 entre C53 e C54, por UF e faixa quinquenal
    ref = c.C53 + c.C54
    share = (c.C53 / ref).where(ref > 0)
    nat = c.groupby('g').sum(); nat_share = nat.C53 / (nat.C53 + nat.C54)
    share = share.fillna(pd.Series(c.index.get_level_values('g').map(nat_share), index=c.index))
    c['C53r'] = c.C53 + c.C55 * share
    out = []
    for uf in ['BR', '31', '33', '15', '35']:
        cc = c if uf == 'BR' else c.loc[uf]; pp = P if uf == 'BR' else P.loc[uf]
        if uf == 'BR': cc = cc.groupby('g').sum(); pp = pp.groupby('g').sum()
        out.append(dict(ano=ano, uf=uf, obitos_C53=int(cc.C53.sum()), C55=int(cc.C55.sum()), C54=int(cc.C54.sum()),
            bruta=round(cc.C53.sum() / pp.sum() * 1e5, 2), adj_5_80=round(adj(cc.C53, pp, 5), 2), adj_11=round(adj(cc.C53, pp, 11), 2),
            adj_redistr=round(adj(cc.C53r, pp, 5), 2), aumento_pct=round(100 * (adj(cc.C53r, pp, 5) / adj(cc.C53, pp, 5) - 1), 1)))
    print(pd.DataFrame(out).to_string(index=False))
