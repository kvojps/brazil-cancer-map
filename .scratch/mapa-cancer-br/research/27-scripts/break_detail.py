"""Q1 detail: modality by month, the break by UF, and by diagnosing establishment (CNES_DIAG).

Usage: python -I break_detail.py <painel.parquet>
"""
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from common import connect

pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500); pd.set_option("display.max_columns", 60)
db = connect(sys.argv[1])

print("== month x modality, todos (counts) ==")
print(db.sql("""PIVOT (SELECT mes, trat, count(*) n FROM c WHERE tipo='todos' AND
  (mes BETWEEN '201801' AND '201808' OR mes BETWEEN '201902' AND '201907' OR mes BETWEEN '202401' AND '202412')
  GROUP BY ALL) ON trat USING sum(n) ORDER BY mes""").df().to_string())

print("\n== month x type: % no info around 2019-05 ==")
print(db.sql("""PIVOT (SELECT tipo, mes, round(100*avg(seminfo::INT),1) v FROM c
  WHERE mes BETWEEN '201902' AND '201908' GROUP BY ALL) ON mes USING first(v) ORDER BY tipo""").df().to_string())

print("\n== UF, todos: % no info and cases per month in 4 periods ==")
print(db.sql("""SELECT uf,
  round(100*avg(seminfo::INT) FILTER (mes BETWEEN '201701' AND '201804'),1) si_pre,
  round(100*avg(seminfo::INT) FILTER (mes BETWEEN '201805' AND '201904'),1) si_mai18,
  round(100*avg(seminfo::INT) FILTER (mes BETWEEN '201905' AND '201912'),1) si_mai19,
  round(100*avg(seminfo::INT) FILTER (ano BETWEEN 2022 AND 2024),1) si_22_24,
  round(count(*) FILTER (mes BETWEEN '201701' AND '201804')/16.0) cm_pre,
  round(count(*) FILTER (mes BETWEEN '201805' AND '201904')/12.0) cm_mai18,
  round(count(*) FILTER (mes BETWEEN '201905' AND '201912')/8.0) cm_mai19
  FROM c WHERE tipo='todos' GROUP BY uf ORDER BY uf""").df().to_string())

print("\n== UF: month of the jump (first month 2018-2019 whose % no info >= pre-break level + 10 pp) ==")
for jump, ufs in db.sql("""WITH m AS (SELECT uf, mes, avg(seminfo::INT) s FROM c
    WHERE tipo='todos' AND mes BETWEEN '201701' AND '201912' GROUP BY ALL),
  pre AS (SELECT uf, avg(s) p FROM m WHERE mes < '201805' GROUP BY uf),
  j AS (SELECT m.uf, min(mes) jump FROM m JOIN pre USING (uf) WHERE mes >= '201801' AND s >= p + 0.10 GROUP BY m.uf)
  SELECT jump, list(uf ORDER BY uf) FROM j GROUP BY jump ORDER BY jump""").fetchall():
    print(jump, len(ufs), ufs)

print("\n== diagnosing establishments: cases from CNES that never diagnosed before May 2018 ==")
print(db.sql("""WITH old AS (SELECT DISTINCT cnes FROM c WHERE tipo='todos' AND mes < '201805' AND mes >= '201401')
  SELECT ano, count(*) casos,
   round(100*avg((cnes NOT IN (SELECT cnes FROM old))::INT),1) pct_cnes_novo,
   round(100*avg(seminfo::INT) FILTER (cnes NOT IN (SELECT cnes FROM old)),1) seminfo_cnes_novo,
   round(100*avg(seminfo::INT) FILTER (cnes IN (SELECT cnes FROM old)),1) seminfo_cnes_antigo,
   round(100*avg(ok60::INT) FILTER (cnes IN (SELECT cnes FROM old)),1) p60_cnes_antigo,
   count(*) FILTER (cnes IN (SELECT cnes FROM old)) casos_cnes_antigo
  FROM c WHERE tipo='todos' AND ano BETWEEN 2014 AND 2024 GROUP BY ano ORDER BY ano""").df().to_string())

print("\n== no-info cases: is the diagnosing CNES a treating one (has any treated case ever)? ==")
print(db.sql("""WITH treaters AS (SELECT DISTINCT cnes FROM c WHERE tipo='todos' AND NOT seminfo)
  SELECT ano, round(100*avg((cnes IN (SELECT cnes FROM treaters))::INT),1) pct_seminfo_em_cnes_que_trata
  FROM c WHERE tipo='todos' AND seminfo AND ano BETWEEN 2016 AND 2024 GROUP BY ano ORDER BY ano""").df().to_string())
