# Métricas do Painel-Oncologia por UF e tipo de câncer (anos de diagnóstico 2019–2023).
# Uso: python po_tipos_uf.py <po_todos.pkl> <saida.csv>
import sys, pandas as pd
df = pd.read_pickle(sys.argv[1])
for c in df.columns: df[c] = df[c].astype(str)
UF = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'}
NMUN = {'RO':52,'AC':22,'AM':62,'RR':15,'PA':144,'AP':16,'TO':139,'MA':217,'PI':224,'CE':184,'RN':167,'PB':223,'PE':185,'AL':102,'SE':75,'BA':417,'MG':853,'ES':78,'RJ':92,'SP':645,'PR':399,'SC':295,'RS':497,'MS':79,'MT':142,'GO':246,'DF':1}
TIPOS = {
    'todos': lambda d: d.DIAGNOSTIC.eq('01'),          # C00–C97 sem C44 e sem C73 (DIAGNOSTIC 04)
    # "Todos" sem sítio mal definido/primário desconhecido (C76–C80): 89% deles vêm sem tratamento e inflam a taxa
    'todos_sem_C76_C80': lambda d: d.DIAGNOSTIC.eq('01') & ~d.DIAG_DETH.isin(['C76','C77','C78','C79','C80']),
    'mama': lambda d: d.DIAG_DETH.eq('C50'),
    'colo_utero': lambda d: d.DIAG_DETH.eq('C53'),
    'prostata': lambda d: d.DIAG_DETH.eq('C61'),
    'colorretal': lambda d: d.DIAG_DETH.isin(['C18','C19','C20','C21']),
    'pulmao': lambda d: d.DIAG_DETH.isin(['C33','C34']),
    'estomago': lambda d: d.DIAG_DETH.eq('C16'),
}
df['uf'] = df.UF_RESID.map(UF)
df['semt'] = df.TRATAMENTO.eq('5')
t = df.TEMPO_TRAT.where(~df.semt & df.TEMPO_TRAT.str.match(r'^[+-]\d{4}$', na=False))
days = t.str[1:].astype(float); days[t.str[0].eq('-')] = 0
df['le60'] = days <= 60
df['tratado'] = days.notna()
faixa = lambda v: 'A' if v < 15 else ('B' if v < 35 else 'C')
rows, trend = [], {}
for tipo, sel in TIPOS.items():
    d = df[sel(df)]
    trend[tipo] = d.groupby('ANO_DIAGN').semt.mean().mul(100).round(1)
    p = d[d.ANO_DIAGN.between('2019', '2023')]
    for uf, g in p.groupby('uf'):
        mc = g.groupby('MUN_RESID').size()
        s = 100 * g.semt.mean()
        rows.append(dict(tipo=tipo, uf=uf, casos_19_23=len(g), sem_trat_19_23=s, faixa=faixa(s),
            sem_trat_2023=100 * g[g.ANO_DIAGN.eq('2023')].semt.mean(),
            le60_tratados=100 * g.le60[g.tratado].mean(),
            mun_com_caso=100 * len(mc) / NMUN[uf], mun_ge20=100 * (mc >= 20).sum() / NMUN[uf]))
    rows.append(dict(tipo=tipo, uf='BR', casos_19_23=len(p), sem_trat_19_23=100 * p.semt.mean(),
        faixa=faixa(100 * p.semt.mean()), sem_trat_2023=100 * p[p.ANO_DIAGN.eq('2023')].semt.mean(),
        le60_tratados=100 * p.le60[p.tratado].mean(),
        mun_com_caso=100 * p.MUN_RESID.nunique() / 5570, mun_ge20=100 * (p.groupby('MUN_RESID').size() >= 20).sum() / 5570))
r = pd.DataFrame(rows).round(1)
r.to_csv(sys.argv[2], index=False)
pd.set_option('display.width', 250); pd.set_option('display.max_rows', 500)
print(r.pivot(index='uf', columns='tipo', values='sem_trat_19_23').to_string())
print(r.pivot(index='uf', columns='tipo', values='faixa').to_string())
print(r.pivot(index='uf', columns='tipo', values='mun_ge20').to_string())
print(r[r.uf == 'BR'].to_string(index=False))
print(pd.DataFrame(trend).T.to_string())
print(r.groupby(['tipo', 'faixa']).size().unstack(fill_value=0))
