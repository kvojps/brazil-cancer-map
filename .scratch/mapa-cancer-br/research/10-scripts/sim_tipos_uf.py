# SIM 2022–2024: óbitos por tipo e peso dos códigos de sítio mal definido que "roubam" óbitos de cada tipo.
# Uso: python sim_tipos_uf.py <dir com DO<UF><ANO>.dbf> <saida.csv>
import sys, os, glob, dbfread, pandas as pd
d, out = sys.argv[1], sys.argv[2]
rows = []
for f in sorted(glob.glob(os.path.join(d, 'DO*.dbf'))):
    uf, ano = os.path.basename(f)[2:4], os.path.basename(f)[4:8]
    c = pd.Series([r['CAUSABAS'] or '' for r in dbfread.DBF(f, encoding='latin-1', ignore_missing_memofile=True)])
    c = c[c.str.startswith('C')]
    c3 = c.str[:3]
    n = lambda *k: int(c3.isin(k).sum())
    rows.append(dict(uf=uf, ano=ano, cancer=len(c),
        prostata=n('C61'), c63=n('C63'),
        colorretal=n('C18', 'C19', 'C20', 'C21'), estomago=n('C16'),
        c26=n('C26'),                       # aparelho digestivo, sítio mal definido
        pulmao=n('C33', 'C34'), c39=n('C39'),  # aparelho respiratório mal definido
        c76_c80=n('C76', 'C77', 'C78', 'C79', 'C80'),  # sítio mal definido, secundário ou primário desconhecido
        c97=n('C97')))
r = pd.DataFrame(rows); r.to_csv(out, index=False)
g = r.groupby('uf').sum(numeric_only=True)
g.loc['BR'] = g.sum()
s = pd.DataFrame({
    'obitos_cancer_22_24': g.cancer,
    'todos_pct_sitio_mal_def': 100 * (g.c76_c80 + g.c97) / g.cancer,
    'digestivo_pct_C26': 100 * g.c26 / (g.colorretal + g.estomago + g.c26),
    'pulmao_pct_C39': 100 * g.c39 / (g.pulmao + g.c39),
    'prostata_pct_C63': 100 * g.c63 / (g.prostata + g.c63),
    'obitos_prostata': g.prostata, 'obitos_colorretal': g.colorretal,
    'obitos_pulmao': g.pulmao, 'obitos_estomago': g.estomago}).round(1).sort_values('todos_pct_sitio_mal_def')
pd.set_option('display.width', 250); print(s.to_string())
s.to_csv(out.replace('.csv', '_resumo.csv'))
