import sys, os, glob, datasus_dbc, dbfread, pandas as pd
d = sys.argv[1]; out = sys.argv[2]
rows = []
for f in sorted(glob.glob(os.path.join(d, 'DO*.dbc'))):
    uf, ano = os.path.basename(f)[2:4], os.path.basename(f)[4:8]
    dbf = f[:-4] + '.dbf'
    if not os.path.exists(dbf): datasus_dbc.decompress(f, dbf)
    c = pd.Series([r['CAUSABAS'] for r in dbfread.DBF(dbf, encoding='latin-1', ignore_missing_memofile=True)]).fillna('')
    c3 = c.str[:3]
    rows.append(dict(uf=uf, ano=ano, obitos=len(c),
        maldef=c3.str.match(r'^R').sum(),
        c00_c97=c3.str.match(r'^C').sum(),
        c50=(c3=='C50').sum(), c53=(c3=='C53').sum(), c54=(c3=='C54').sum(), c55=(c3=='C55').sum(),
        c80_c76=c3.isin(['C76','C80']).sum()))
r = pd.DataFrame(rows)
r.to_csv(out, index=False)
g = r.groupby('uf').sum(numeric_only=True)
s = pd.DataFrame({'obitos_22_24': g.obitos, 'pct_maldef': 100*g.maldef/g.obitos,
    'pct_cancer_sitio_mal_def': 100*g.c80_c76/g.c00_c97,
    'pct_utero_sem_sitio_C55': 100*g.c55/(g.c53+g.c54+g.c55),
    'obitos_c50': g.c50, 'obitos_c53': g.c53}).round(1).sort_values('pct_maldef')
pd.set_option('display.width', 200); print(s.to_string())
t = r.groupby('ano').sum(numeric_only=True); print((100*t.maldef/t.obitos).round(1))
s.to_csv(out.replace('.csv','_resumo.csv'))
