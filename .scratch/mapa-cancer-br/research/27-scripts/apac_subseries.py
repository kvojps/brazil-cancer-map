"""Q3 check: is the % within 60 days of chemo/radio-treated cases (APAC, codes 2-4) free of the breaks?

Usage: python -I apac_subseries.py <painel.parquet>
"""
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(__file__))
from common import connect

pd.set_option("display.width", 250); pd.set_option("display.max_rows", 300)
db = connect(sys.argv[1])
print("== % within 60 by modality and month, todos, around the breaks ==")
print(db.sql("""SELECT mes,
  round(100*avg(ok60::INT) FILTER (trat='1'),1) cirurgia,
  round(100*avg(ok60::INT) FILTER (trat IN ('2','3','4')),1) quimio_radio,
  count(*) FILTER (trat IN ('2','3','4')) n_qr
  FROM c WHERE tipo='todos' AND (mes BETWEEN '201801' AND '201808' OR mes BETWEEN '201902' AND '201907'
   OR mes BETWEEN '202401' AND '202406') GROUP BY mes ORDER BY mes""").df().to_string())
print("\n== by year and type: % within 60 among chemo/radio cases ==")
print(db.sql("""PIVOT (SELECT tipo, ano, round(100*avg(ok60::INT),1) v FROM c
  WHERE trat IN ('2','3','4') AND ano BETWEEN 2014 AND 2024 GROUP BY ALL) ON ano USING first(v) ORDER BY tipo""").df().to_string())
