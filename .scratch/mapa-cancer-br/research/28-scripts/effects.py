"""Q3: effect of the 2024 surgery drop on the value, the % without information, the A/B/C band
and the Situacao, and the options for the Situacao rule.

Usage: python -I effects.py <painel.parquet> <municipalities.json>
Counterfactual ("cf"): the surgeries missing in a year are put back at the 2023 level of the same
UF x type (residence), with that year's observed share within 60 days among surgeries. It is only a
yardstick for the size of the effect, not a proposed method.
"""
import collections
import json
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from common import connect

pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500); pd.set_option("display.max_columns", 60)
db = connect(sys.argv[1])
listing = json.load(open(sys.argv[2]))["municipalities"]
UF_CODE = {m["code"][:2]: m["uf"] for m in listing}

# Per UF x type x year: cases, within 60, no info, surgeries, surgeries within 60, chemo/radio, chemo/radio within 60.
db.execute("""CREATE TABLE y AS SELECT tipo, uf, ano, count(*) n, sum(ok60::INT) ok, sum(seminfo::INT) si,
  count(*) FILTER (trat='1') cir, count(*) FILTER (trat='1' AND ok60) cir_ok,
  count(*) FILTER (trat IN ('2','3','4')) qr, count(*) FILTER (trat IN ('2','3','4') AND ok60) qr_ok
  FROM c WHERE ano BETWEEN 2019 AND 2025 GROUP BY ALL""")
# Counterfactual add-back: missing = max(0, surgeries 2023 - surgeries of the year), for 2024 and 2025.
db.execute("""CREATE TABLE ycf AS SELECT y.*,
  CASE WHEN y.ano >= 2024 THEN greatest(0, b.cir - y.cir) ELSE 0 END miss,
  CASE WHEN y.cir > 0 THEN y.cir_ok / y.cir ELSE 0.9 END cir_rate
  FROM y LEFT JOIN (SELECT tipo, uf, cir FROM y WHERE ano = 2023) b USING (tipo, uf)""")

print("== Brasil, by type and year: value under each option ==")
print("  todos = % within 60 of all cases (current rule); cf = counterfactual with surgeries put back;")
print("  sem_cir = % within 60 excluding surgery-first cases; qr = % within 60 among chemo/radio cases (Tendencia's cut)")
print(db.sql("""SELECT tipo, ano, sum(n) casos,
  round(100*sum(ok)/sum(n),1) todos, round(100*(sum(ok)+sum(miss*cir_rate))/(sum(n)+sum(miss)),1) cf,
  round(100*sum(si)/sum(n),1) p_si, round(100*sum(si)/(sum(n)+sum(miss)),1) p_si_cf,
  round(100*(sum(ok)-sum(cir_ok))/(sum(n)-sum(cir)),1) sem_cir, round(100*sum(qr_ok)/sum(qr),1) qr,
  round(sum(miss)) cir_faltando
  FROM ycf GROUP BY tipo, ano ORDER BY tipo, ano""").df().to_string())

print("\n== A/B/C band per UF x type: % no info pooled over the window ==")


def band(p):
    return "A" if p <= 15 else ("B" if p < 35 else "C")


rows = db.sql("""SELECT tipo, uf,
  100*sum(si) FILTER (ano BETWEEN 2020 AND 2024)/sum(n) FILTER (ano BETWEEN 2020 AND 2024) w24,
  100*sum(si) FILTER (ano BETWEEN 2020 AND 2024)/(sum(n) FILTER (ano BETWEEN 2020 AND 2024)+sum(miss) FILTER (ano BETWEEN 2020 AND 2024)) w24cf,
  100*sum(si) FILTER (ano BETWEEN 2019 AND 2023)/sum(n) FILTER (ano BETWEEN 2019 AND 2023) w23,
  100*sum(si) FILTER (ano BETWEEN 2021 AND 2025)/sum(n) FILTER (ano BETWEEN 2021 AND 2025) w25,
  100*sum(si) FILTER (ano BETWEEN 2021 AND 2025)/(sum(n) FILTER (ano BETWEEN 2021 AND 2025)+sum(miss) FILTER (ano BETWEEN 2021 AND 2025)) w25cf,
  100*sum(si) FILTER (ano = 2024)/sum(n) FILTER (ano = 2024) y24,
  100*sum(si) FILTER (ano = 2023)/sum(n) FILTER (ano = 2023) y23
  FROM ycf GROUP BY tipo, uf ORDER BY tipo, uf""").df()
for col in ["w24", "w24cf", "w23", "w25", "w25cf"]:
    rows["b_" + col] = rows[col].map(band)
rows["uf"] = rows.uf.map(UF_CODE)
print("bands, 2020-2024 actual vs counterfactual (UF x type cells that change):")
ch = rows[rows.b_w24 != rows.b_w24cf]
print(ch[["tipo", "uf", "w24", "w24cf", "b_w24", "b_w24cf"]].round(1).to_string() if len(ch) else "  none")
print("\nbands, 2020-2024 vs 2019-2023 (cells that change):")
ch = rows[rows.b_w24 != rows.b_w23]
print(ch[["tipo", "uf", "w23", "w24", "b_w23", "b_w24"]].round(1).to_string())
print("\nbands, 2021-2025 actual vs counterfactual (future window; 2025 still provisional):")
ch = rows[rows.b_w25 != rows.b_w25cf]
print(ch[["tipo", "uf", "w25", "w25cf", "b_w25", "b_w25cf"]].round(1).to_string() if len(ch) else "  none")
print("\nmax change in the pooled 2020-2024 % no info caused by the drop (actual - cf), by type:")
rows["delta"] = rows.w24 - rows.w24cf
print(rows.groupby("tipo").delta.agg(["mean", "max"]).round(2).to_string())
print("\nband counts per window:")
print(pd.DataFrame({c: rows["b_" + c].value_counts() for c in ["w23", "w24", "w24cf", "w25", "w25cf"]}).fillna(0).astype(int).to_string())

print("\n== Situacao of municipalities, 'todos', with the cascade (mean >= 20 chemo/radio cases/year 2015-2024) ==")
region = {m["code"]: m["immediate_region"] for m in listing}
mun = db.sql("""SELECT mun, ano, count(*) n, sum(ok60::INT) ok, count(*) FILTER (trat='1') cir,
  count(*) FILTER (trat='1' AND ok60) cir_ok, count(*) FILTER (trat IN ('2','3','4')) qr,
  count(*) FILTER (trat IN ('2','3','4') AND ok60) qr_ok, sum(seminfo::INT) si
  FROM c WHERE tipo='todos' AND ano BETWEEN 2015 AND 2025 GROUP BY ALL""").fetchall()
data = collections.defaultdict(lambda: collections.defaultdict(lambda: [0] * 7))
for m, ano, *vals in mun:
    for key in (m, "R" + region.get(m, "?")):
        for i, v in enumerate(vals):
            data[key][ano][i] += v


def unit(code):
    qr_mean = lambda k: sum(data[k][a][4] for a in range(2015, 2025)) / 10
    if qr_mean(code) >= 20:
        return code
    r = "R" + region[code]
    return r if qr_mean(r) >= 20 else None


OPTIONS = {
    "1. 2024, todos os casos (atual)": lambda d: (d[2024][1], d[2024][0]),
    "2. 2023, todos os casos": lambda d: (d[2023][1], d[2023][0]),
    "3. 2024, sem as cirurgias": lambda d: (d[2024][1] - d[2024][3], d[2024][0] - d[2024][2]),
    "4. 2024, so quimio/radio": lambda d: (d[2024][5], d[2024][4]),
    "3b. 2023, sem as cirurgias": lambda d: (d[2023][1] - d[2023][3], d[2023][0] - d[2023][2]),
    "4b. 2023, so quimio/radio": lambda d: (d[2023][5], d[2023][4]),
    "1f. 2025 (provisorio), todos": lambda d: (d[2025][1], d[2025][0]),
    "3f. 2025 (provisorio), sem cirurgias": lambda d: (d[2025][1] - d[2025][3], d[2025][0] - d[2025][2]),
    "4f. 2025 (provisorio), quimio/radio": lambda d: (d[2025][5], d[2025][4]),
}
units = {code: unit(code) for code in region}
print(f"{'opcao':38} {'alcancou':>8} {'perto':>6} {'longe':>6} {'insuf.':>6} | mediana % | Brasil %")
base = None
for name, f in OPTIONS.items():
    cls, vals = collections.Counter(), []
    for code, u in units.items():
        if u is None:
            cls["insuf"] += 1
            continue
        num, den = f(data[u])
        if den == 0:
            cls["insuf"] += 1
            continue
        v = 100 * num / den
        vals.append(v)
        cls["alcancou" if v >= 100 else "perto" if v >= 80 else "longe"] += 1
    br = collections.defaultdict(lambda: [0] * 7)
    for m in {m for m in data if not m.startswith("R")}:
        for a, v in data[m].items():
            for i, x in enumerate(v):
                br[a][i] += x
    num, den = f(br)
    print(f"{name:38} {cls['alcancou']:8} {cls['perto']:6} {cls['longe']:6} {cls['insuf']:6} | "
          f"{pd.Series(vals).median():8.1f} | {100 * num / den:5.1f}")

print("\n== municipalities/regions (as used by the cascade): change of the value 2023 -> 2024, all cases ==")
diffs = []
for code, u in units.items():
    if u is None:
        continue
    d = data[u]
    if d[2023][0] and d[2024][0]:
        diffs.append(100 * d[2024][1] / d[2024][0] - 100 * d[2023][1] / d[2023][0])
s = pd.Series(diffs)
print(s.describe().round(1).to_string())
print("share of municipalities whose value fell by more than 5 p.p.:", round(100 * (s < -5).mean(), 1))
