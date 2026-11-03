"""Q2b: did the lost surgery cases vanish or move to another modality / "sem informacao"?

Usage: python -I reclassified.py <painel.parquet>
"Switch-off" establishments = treating CNES whose surgery-first cases fell below 10% of the before level
(treatment months 2023-04..2024-02 vs 2025-01..2025-11) while they kept chemo/radio first treatments (>= 50%).
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
db.execute(f"""CREATE TABLE off AS SELECT cnes_tra AS cnes FROM c WHERE tipo='todos' AND trat IN ('1','2','3','4')
  GROUP BY cnes_tra HAVING count(*) FILTER ({BEFORE} AND trat='1') >= 20
   AND count(*) FILTER ({AFTER} AND trat='1') < 0.1*count(*) FILTER ({BEFORE} AND trat='1')
   AND count(*) FILTER ({AFTER} AND trat IN ('2','3','4')) >= 0.5*count(*) FILTER ({BEFORE} AND trat IN ('2','3','4'))""")
db.execute(f"""CREATE TABLE kept AS SELECT cnes_tra AS cnes FROM c WHERE tipo='todos' AND trat='1'
  GROUP BY cnes_tra HAVING count(*) FILTER ({BEFORE}) >= 20 AND count(*) FILTER ({AFTER}) >= 0.8*count(*) FILTER ({BEFORE})""")
print("switch-off establishments:", db.sql("SELECT count(*) FROM off").fetchall()[0][0],
      "| kept establishments:", db.sql("SELECT count(*) FROM kept").fetchall()[0][0])

print("\n== switch-off establishments: last month with >= 20% of their usual monthly surgeries (distribution) ==")
print(db.sql(f"""WITH m AS (SELECT cnes_tra, mes_tra, count(*) n FROM c WHERE tipo='todos' AND trat='1'
    AND cnes_tra IN (SELECT cnes FROM off) AND mes_tra BETWEEN '202304' AND '202512' GROUP BY ALL),
  b AS (SELECT cnes_tra, sum(n) FILTER ({BEFORE})/11.0 base FROM m GROUP BY cnes_tra),
  last AS (SELECT cnes_tra, max(mes_tra) ultimo FROM m JOIN b USING (cnes_tra) WHERE n >= 0.2*base GROUP BY cnes_tra)
  SELECT ultimo, count(*) estab, round(sum(base)) cir_mes_antes FROM last JOIN b USING (cnes_tra)
  GROUP BY ultimo ORDER BY ultimo""").df().to_string())

print("\n== cases DIAGNOSED in the switch-off establishments (CNES_DIAG in off) vs kept, by diagnosis semester ==")
print(db.sql("""SELECT CASE WHEN cnes IN (SELECT cnes FROM off) THEN 'off' WHEN cnes IN (SELECT cnes FROM kept) THEN 'kept' ELSE 'other' END grupo,
  substr(mes,1,4) || CASE WHEN substr(mes,5,2) <= '06' THEN '-1' ELSE '-2' END sem,
  count(*) casos, count(*) FILTER (trat='1') cir, count(*) FILTER (trat IN ('2','3','4')) qr, count(*) FILTER (trat='5') si,
  round(100*avg(ok60::INT),1) p60, round(100*avg(seminfo::INT),1) p_si
  FROM c WHERE tipo='todos' AND mes BETWEEN '202201' AND '202512' GROUP BY ALL ORDER BY grupo, sem""").df().to_string())

print("\n== chemo/radio first treatments in switch-off establishments: days from diagnosis (before vs after) ==")
print(db.sql(f"""SELECT CASE WHEN {BEFORE} THEN 'antes' ELSE 'depois' END per, count(*)/11 qr_mes,
  round(100*avg(ok60::INT),1) p60,
  round(100*avg((substr(tempo,1,1)='+' AND TRY_CAST(substr(tempo,2) AS INT) BETWEEN 61 AND 180)::INT),1) pct_61_180,
  round(100*avg((substr(tempo,1,1)='+' AND TRY_CAST(substr(tempo,2) AS INT) > 180)::INT),1) pct_180mais
  FROM c WHERE tipo='todos' AND trat IN ('2','3','4') AND cnes_tra IN (SELECT cnes FROM off) AND ({BEFORE} OR {AFTER})
  GROUP BY per ORDER BY per""").df().to_string())

print("\n== national balance, todos: 2024 and 2025 vs 2023 by modality (diagnosis year) ==")
print(db.sql("""PIVOT (SELECT ano, CASE trat WHEN '1' THEN 'cir' WHEN '5' THEN 'si' ELSE 'qr' END m, count(*) n
  FROM c WHERE tipo='todos' AND ano BETWEEN 2022 AND 2025 GROUP BY ALL) ON m USING sum(n) ORDER BY ano""").df().to_string())
