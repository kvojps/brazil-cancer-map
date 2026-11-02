import sys, pandas as pd
df = pd.read_pickle(sys.argv[1])
UF = {'11':'RO','12':'AC','13':'AM','14':'RR','15':'PA','16':'AP','17':'TO','21':'MA','22':'PI','23':'CE','24':'RN','25':'PB','26':'PE','27':'AL','28':'SE','29':'BA','31':'MG','32':'ES','33':'RJ','35':'SP','41':'PR','42':'SC','43':'RS','50':'MS','51':'MT','52':'GO','53':'DF'}
NMUN = {'RO':52,'AC':22,'AM':62,'RR':15,'PA':144,'AP':16,'TO':139,'MA':217,'PI':224,'CE':184,'RN':167,'PB':223,'PE':185,'AL':102,'SE':75,'BA':417,'MG':853,'ES':78,'RJ':92,'SP':645,'PR':399,'SC':295,'RS':497,'MS':79,'MT':142,'GO':246,'DF':1}
df['uf'] = df.UF_RESID.map(UF)
df['semt'] = df.TRATAMENTO.eq('5')
t = df.TEMPO_TRAT.where(~df.semt & df.TEMPO_TRAT.str.match(r'^[+-]\d{4}$', na=False))
days = t.str[1:].astype(float); days[t.str[0].eq('-')] = 0
df['le60'] = days <= 60
df['tratado'] = days.notna()
df['quimrad'] = df.TRATAMENTO.isin(['2','3','4'])
df['precoce'] = df.ESTADIAM.isin(['0','1','2'])
p = df[df.ANO_DIAGN.between('2019','2023')]
rows = []
for (cid, uf), g in p.groupby(['DIAG_DETH','uf']):
    q = g[g.quimrad]
    y23 = g[g.ANO_DIAGN.eq('2023')]
    mc = g.groupby('MUN_RESID').size()
    rows.append(dict(cid=cid, uf=uf, casos_19_23=len(g),
        sem_trat_19_23=100*g.semt.mean(), sem_trat_2023=100*y23.semt.mean(),
        le60_tratados=100*g.le60[g.tratado].mean(),
        precoce_quimrad=100*q.precoce.mean(),
        mun_com_caso=100*len(mc)/NMUN[uf],
        mun_ge20=100*(mc>=20).sum()/NMUN[uf]))
r = pd.DataFrame(rows).round(1)
r.to_csv(sys.argv[2], index=False)
pd.set_option('display.width', 200)
for cid in ['C50','C53']:
    print(cid); print(r[r.cid==cid].drop(columns='cid').sort_values('sem_trat_19_23').to_string(index=False))
# national trend
tr = df.groupby(['DIAG_DETH','ANO_DIAGN']).semt.mean().unstack().mul(100).round(1)
print(tr)
