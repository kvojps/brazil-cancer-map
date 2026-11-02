# Uso: python sim_agg.py <dir com DO<UF><ANO>.dbf> 2022,2023,2024 sim.pkl
# Agrega SIM (óbitos de câncer, causa básica C) por UF de residência, ano, sexo, idade em anos e CID de 3 dígitos.
import sys, glob, os, dbfread, pandas as pd
d, anos, out = sys.argv[1], sys.argv[2].split(','), sys.argv[3]
rows = []
for ano in anos:
    for f in sorted(glob.glob(os.path.join(d, f'DO??{ano}.dbf'))):
        for r in dbfread.DBF(f, encoding='latin-1', ignore_missing_memofile=True):
            c = (r.get('CAUSABAS') or '')
            if not c.startswith(('C', 'R')): continue
            idade = r.get('IDADE') or ''
            if len(idade) == 3 and idade[0] == '4': a = int(idade[1:])
            elif len(idade) == 3 and idade[0] == '5': a = 100 + int(idade[1:])
            elif len(idade) == 3 and idade[0] in '0123': a = 0
            else: a = -1
            rows.append((ano, (r.get('CODMUNRES') or '')[:6], r.get('SEXO'), a, c[:3]))
        print(f, len(rows), flush=True)
df = pd.DataFrame(rows, columns=['ano', 'mun', 'sexo', 'idade', 'cid'])
df.groupby(['ano', 'mun', 'sexo', 'idade', 'cid']).size().rename('n').reset_index().to_pickle(out)
