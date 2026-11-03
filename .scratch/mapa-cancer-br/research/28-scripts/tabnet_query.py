"""Query a DATASUS TabNet table (SIH or SIA) by month and print it as CSV-like text.

Usage: python -I tabnet_query.py <sih|sia> <out.html> <row> <column> <increment> [filter=value ...]
  sih: procedimentos hospitalares por local de internacao (sih/cnv/qibr.def), files qibrAAMM.dbf
  sia: producao ambulatorial por local de atendimento (sia/cnv/qabr.def), files qabrAAMM.dbf
  filters: TabNet selection fields, e.g. "SSubgrupo_proced.=43" or "SProcedimento=786" (repeatable).
Uses processing months 2022-01 .. 2026-08 (SIH) or 2026-07 (SIA), so the "atendimento" months near the end are incomplete.
Examples used in the findings:
  sih out.html "Ano/mês_atendimento" "Subgrupo_proced." AIH_aprovadas SSubgrupo_proced.=43 SSubgrupo_proced.=20
  sia out.html "Ano/mês_atendimento" Procedimento Qtd.aprovada SProcedimento=786 SProcedimento=790
  sia out.html "Ano/mês_atendimento" Documento_registro Qtd.aprovada SProcedimento=786
"""
import re
import sys
import urllib.parse
import urllib.request

system, out, row, column, increment, *filters = sys.argv[1:]
prefix, path, last = {"sih": ("qibr", "sih/cnv/qibr.def", (26, 8)), "sia": ("qabr", "sia/cnv/qabr.def", (26, 7))}[system]
files = [f"{prefix}{y:02d}{m:02d}.dbf" for y in range(22, 27) for m in range(1, 13) if (y, m) <= last]
fields = [("Linha", row), ("Coluna", column), ("Incremento", increment)]
fields += [("Arquivos", f) for f in files]
fields += [tuple(f.split("=", 1)) for f in filters]
fields += [("formato", "prn"), ("mostre", "Mostra")]
body = urllib.parse.urlencode(fields, encoding="latin-1").encode()
req = urllib.request.Request(f"http://tabnet.datasus.gov.br/cgi/tabcgi.exe?{path}", data=body)
with urllib.request.urlopen(req, timeout=600) as r:
    page = r.read()
open(out, "wb").write(page)
text = re.sub(r"<[^>]*>", "", page.decode("latin-1"))
print("\n".join(line for line in text.splitlines() if line.startswith('"') or "Subgrupo" in line or "Procedimento" in line))
