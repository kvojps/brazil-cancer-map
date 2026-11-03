"""Q1: date the drop. Monthly counts by modality, by diagnosis month and by treatment month.

Usage: python -I month_profile.py <painel.parquet>
"""
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from common import connect

pd.set_option("display.width", 250); pd.set_option("display.max_rows", 500); pd.set_option("display.max_columns", 60)
db = connect(sys.argv[1])

print("== by DIAGNOSIS month (ANOMES_DIA), todos: cases by modality, % within 60, % no info ==")
print(db.sql("""SELECT mes, count(*) casos,
  count(*) FILTER (trat='1') cir, count(*) FILTER (trat IN ('2','3','4')) qr, count(*) FILTER (trat='5') si,
  round(100*avg(ok60::INT),1) p60, round(100*avg(seminfo::INT),1) p_si,
  round(100*avg(ok60::INT) FILTER (trat='1'),1) p60_cir
  FROM c WHERE tipo='todos' AND mes BETWEEN '202201' AND '202612' GROUP BY mes ORDER BY mes""").df().to_string())

print("\n== by TREATMENT month (ANOMES_TRA), todos: surgery vs chemo/radio first treatments ==")
print(db.sql("""SELECT mes_tra, count(*) FILTER (trat='1') cir, count(*) FILTER (trat IN ('2','3','4')) qr,
  count(*) FILTER (trat='1' AND tempo LIKE '-%') cir_antes_diag
  FROM c WHERE tipo='todos' AND mes_tra BETWEEN '202201' AND '202612' GROUP BY mes_tra ORDER BY mes_tra""").df().to_string())

print("\n== surgery cases: diagnosis month x treatment month offset, 2023-10..2024-08 diagnoses ==")
print(db.sql("""PIVOT (SELECT mes, mes_tra, count(*) n FROM c WHERE tipo='todos' AND trat='1'
  AND mes BETWEEN '202310' AND '202408' AND mes_tra BETWEEN '202308' AND '202410' GROUP BY ALL)
  ON mes_tra USING sum(n) ORDER BY mes""").df().to_string())
