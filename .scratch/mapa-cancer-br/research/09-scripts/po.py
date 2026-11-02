import sys, os, glob, datasus_dbc, dbfread, pandas as pd
d = sys.argv[1]; out = sys.argv[2]
cols = ['ANO_DIAGN','UF_RESID','MUN_RESID','TRATAMENTO','DIAGNOSTIC','ESTADIAM','TEMPO_TRAT','DIAG_DETH','SEXO']
frames = []
for f in sorted(glob.glob(os.path.join(d, 'POBR*.dbc'))):
    dbf = f[:-4] + '.dbf'
    if not os.path.exists(dbf): datasus_dbc.decompress(f, dbf)
    df = pd.DataFrame(iter(dbfread.DBF(dbf, encoding='latin-1')))[cols]
    frames.append(df[df.DIAG_DETH.isin(['C50','C53'])])
df = pd.concat(frames)
df.to_parquet(out) if False else df.to_pickle(out)
print(df.groupby(['ANO_DIAGN','DIAG_DETH','DIAGNOSTIC']).size().unstack())
print(pd.crosstab(df.TRATAMENTO, df.ESTADIAM))
