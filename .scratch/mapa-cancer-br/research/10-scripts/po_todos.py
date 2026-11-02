# Extrai do Painel-Oncologia todos os casos com CID C (todas as neoplasias malignas).
# Uso: python po_todos.py <dir com POBR*.dbc> <saida.pkl>
import sys, os, glob, datasus_dbc, dbfread, pandas as pd
d, out = sys.argv[1], sys.argv[2]
cols = ['ANO_DIAGN','UF_RESID','MUN_RESID','TRATAMENTO','DIAGNOSTIC','TEMPO_TRAT','DIAG_DETH']
frames = []
for f in sorted(glob.glob(os.path.join(d, 'POBR*.dbc'))):
    dbf = f[:-4] + '.dbf'
    if not os.path.exists(dbf): datasus_dbc.decompress(f, dbf)
    rows = ([r[c] for c in cols] for r in dbfread.DBF(dbf, encoding='latin-1') if r['DIAG_DETH'][:1] == 'C')
    df = pd.DataFrame(rows, columns=cols).astype('category')
    frames.append(df); print(f, len(df), flush=True)
df = pd.concat(frames, ignore_index=True)
for c in cols: df[c] = df[c].astype('category')
df.to_pickle(out)
print(pd.crosstab(df.DIAGNOSTIC, df.DIAG_DETH.astype(str).eq('C44')))
