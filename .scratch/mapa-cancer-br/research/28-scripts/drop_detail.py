"""Q2: where the surgery drop happens (UF, cancer type, treating establishment) and whether the
lost surgery cases vanished or were reclassified.

Usage: python -I drop_detail.py <painel.parquet>
"Before" = treatment months 2023-04..2024-02 (11 months), "after" = 2025-01..2025-11 (11 months), by ANOMES_TRA.
"""
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from common import connect

pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500); pd.set_option("display.max_columns", 60)
db = connect(sys.argv[1])
BEFORE = "mes_tra BETWEEN '202304' AND '202402'"
AFTER = "mes_tra BETWEEN '202501' AND '202511'"

print("== year x type x modality (diagnosis year) ==")
print(db.sql("""SELECT tipo, ano, count(*) casos, count(*) FILTER (trat='1') cir,
  count(*) FILTER (trat IN ('2','3','4')) qr, count(*) FILTER (trat='5') si,
  round(100*avg(ok60::INT),1) p60, round(100*avg(seminfo::INT),1) p_si,
  round(100*avg(ok60::INT) FILTER (trat='1'),1) p60_cir, round(100*avg(ok60::INT) FILTER (trat IN ('2','3','4')),1) p60_qr
  FROM c WHERE ano BETWEEN 2021 AND 2026 GROUP BY ALL ORDER BY tipo, ano""").df().to_string())

print("\n== UF of residence, todos: surgeries per month before vs after, and the first month below 70% of the before level ==")
print(db.sql(f"""WITH m AS (SELECT uf, mes_tra, count(*) n FROM c WHERE tipo='todos' AND trat='1' AND mes_tra BETWEEN '202304' AND '202512' GROUP BY ALL),
  b AS (SELECT uf, sum(n)/11.0 base FROM m WHERE {BEFORE} GROUP BY uf),
  a AS (SELECT uf, sum(n)/11.0 depois FROM m WHERE {AFTER} GROUP BY uf),
  first_low AS (SELECT m.uf, min(mes_tra) mes_queda FROM m JOIN b USING (uf)
    WHERE mes_tra >= '202403' AND n < 0.7*base
      AND NOT EXISTS (SELECT 1 FROM m m2 WHERE m2.uf=m.uf AND m2.mes_tra > m.mes_tra AND m2.mes_tra <= '202512' AND m2.n >= 0.85*b.base)
    GROUP BY m.uf)
  SELECT uf, round(base) antes, round(depois) depois, round(100*depois/base) pct, mes_queda
  FROM b JOIN a USING (uf) LEFT JOIN first_low USING (uf) ORDER BY pct""").df().to_string())

print("\n== UF of the TREATING establishment, todos: surgeries per month before vs after ==")
print(db.sql(f"""SELECT uf_tra, round(count(*) FILTER ({BEFORE})/11.0) antes, round(count(*) FILTER ({AFTER})/11.0) depois,
  round(100.0*count(*) FILTER ({AFTER})/count(*) FILTER ({BEFORE})) pct
  FROM c WHERE tipo='todos' AND trat='1' GROUP BY uf_tra HAVING count(*) FILTER ({BEFORE}) > 0 ORDER BY pct""").df().to_string())

print("\n== type: surgeries per month before vs after ==")
print(db.sql(f"""SELECT tipo, round(count(*) FILTER ({BEFORE})/11.0) antes, round(count(*) FILTER ({AFTER})/11.0) depois,
  round(100.0*count(*) FILTER ({AFTER})/count(*) FILTER ({BEFORE})) pct
  FROM c WHERE trat='1' GROUP BY tipo ORDER BY tipo""").df().to_string())

print("\n== treating establishments (CNES_TRAT) with surgeries before: distribution of after/before ratio ==")
est = db.sql(f"""SELECT cnes_tra, count(*) FILTER ({BEFORE}) b, count(*) FILTER ({AFTER}) a,
    count(*) FILTER ({BEFORE} AND trat IN ('2','3','4')) bq, count(*) FILTER ({AFTER} AND trat IN ('2','3','4')) aq
  FROM c WHERE tipo='todos' AND trat IN ('1','2','3','4') GROUP BY cnes_tra""").df()
cir = db.sql(f"""SELECT cnes_tra, count(*) FILTER ({BEFORE}) b, count(*) FILTER ({AFTER}) a
  FROM c WHERE tipo='todos' AND trat='1' GROUP BY cnes_tra HAVING count(*) FILTER ({BEFORE}) > 0""").df()
cir["ratio"] = cir.a / cir.b
cir["bucket"] = pd.cut(cir.ratio, [-0.01, 0, 0.1, 0.3, 0.5, 0.7, 0.9, 1.1, 99],
                       labels=["0", "0-10%", "10-30%", "30-50%", "50-70%", "70-90%", "90-110%", ">110%"])
g = cir.groupby("bucket", observed=False).agg(estab=("cnes_tra", "size"), cir_antes=("b", "sum"), cir_depois=("a", "sum"))
g["share_of_loss"] = ((g.cir_antes - g.cir_depois) / (cir.b.sum() - cir.a.sum()) * 100).round(1)
print(g.to_string())
print("establishments:", len(cir), "| surgeries before:", cir.b.sum(), "after:", cir.a.sum())
top = cir.assign(loss=cir.b - cir.a).sort_values("loss", ascending=False)
top["cum_share"] = (top.loss.cumsum() / top.loss.sum() * 100).round(1)
print("number of establishments making 50% / 80% of the net loss:",
      (top.cum_share < 50).sum() + 1, (top.cum_share < 80).sum() + 1)
print("\n-- top 25 by loss (with their chemo/radio first treatments before/after) --")
print(top.head(25).merge(est[["cnes_tra", "bq", "aq"]], on="cnes_tra").to_string())

print("\n== within the same establishments: still-surgery cases after the drop. Are the remaining ones odd? ==")
print(db.sql(f"""SELECT CASE WHEN {BEFORE} THEN 'antes' ELSE 'depois' END per,
  round(100*avg((tempo LIKE '-%')::INT),1) pct_cir_antes_do_laudo, round(100*avg(ok60::INT),1) p60,
  round(100*avg((cnes=cnes_tra)::INT),1) pct_mesmo_estab_diag
  FROM c WHERE tipo='todos' AND trat='1' AND ({BEFORE} OR {AFTER}) GROUP BY per""").df().to_string())
