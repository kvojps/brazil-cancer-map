# Série 2014–2024 do SIM pelo TabNet (óbitos por residência): útero (C53/C54/C55) e digestivos (C15–C26).
# Calcula a variação anual das contagens com e sem redistribuição do C55 e do C26.
# Uso: python tabnet_series.py   (só biblioteca padrão; o TabNet responde em HTTP, não em HTTPS)
import urllib.parse, urllib.request, re, math
URL = 'http://tabnet.datasus.gov.br/cgi/tabcgi.exe?sim/cnv/obt10uf.def'
DEF = 'http://tabnet.datasus.gov.br/cgi/deftohtm.exe?sim/cnv/obt10uf.def'
ANOS = range(14, 25)
html = urllib.request.urlopen(DEF, timeout=120).read().decode('latin-1')
COD = {m.group(2): m.group(1) for m in re.finditer(r'<OPTION VALUE="(\d+)">(C\d\d) ', html)}
def tab(cids):
    pairs = [('Linha', 'Categoria_CID-10'), ('Coluna', 'Ano_do_Óbito'), ('Incremento', 'Óbitos_p/Residênc')]
    pairs += [('Arquivos', f'obtuf{a:02d}.dbf') for a in ANOS]
    pairs += [('SCategoria_CID-10', COD[c]) for c in cids] + [('formato', 'prn'), ('mostre', 'Mostra')]
    r = urllib.request.urlopen(urllib.request.Request(URL, data=urllib.parse.urlencode(pairs, encoding='latin-1').encode()), timeout=180).read().decode('latin-1')
    return {m.group(1): [int(x) for x in m.group(2).split(';')[:-1]] for m in (re.match(r'"(C\d\d)[^"]*";(.*)', l) for l in r.splitlines()) if m}
def apc(y):
    n = len(y); x = range(n); ly = [math.log(v) for v in y]; mx = sum(x) / n; my = sum(ly) / n
    return 100 * (math.exp(sum((i - mx) * (ly[i] - my) for i in x) / sum((i - mx) ** 2 for i in x)) - 1)
u = tab(['C53', 'C54', 'C55'])
c53, c54, c55 = u['C53'], u['C54'], u['C55']
red = [c53[i] + c55[i] * c53[i] / (c53[i] + c54[i]) for i in range(len(c53))]
print('C53', c53); print('C54', c54); print('C55', c55)
print('C55 % do útero', [round(100 * c55[i] / (c53[i] + c54[i] + c55[i]), 1) for i in range(len(c53))])
print('APC contagem colo: só C53 %.2f | C53 + C55 redistribuído %.2f' % (apc(c53), apc(red)))
dig = [f'C{i}' for i in range(15, 27)]
d = tab(dig)
cr = [sum(d[c][i] for c in ['C18', 'C19', 'C20', 'C21']) for i in range(len(c53))]
spec = [sum(d[c][i] for c in dig if c != 'C26') for i in range(len(c53))]
corr = [cr[i] + d['C26'][i] * cr[i] / spec[i] for i in range(len(c53))]
print('C26 % dos digestivos', [round(100 * d['C26'][i] / (spec[i] + d['C26'][i]), 1) for i in range(len(c53))])
print('APC contagem colorretal: sem C26 %.2f | com C26 redistribuído %.2f' % (apc(cr), apc(corr)))
