"""Q1: the break by year x cancer type, by month, by UF, by diagnosing establishment and modality.

Usage: python -I break_by_year.py <painel.parquet>
"""
import sys

sys.path.insert(0, __import__("os").path.dirname(__file__))
from common import connect

db = connect(sys.argv[1])
pd_opts = __import__("pandas")
pd_opts.set_option("display.width", 250)
pd_opts.set_option("display.max_rows", 500)
pd_opts.set_option("display.max_columns", 50)

print("== year x type: cases, % within 60 (all cases), % no info, % within 60 among treated ==")
print(db.sql("""SELECT tipo, ano, count(*) casos,
  round(100*avg(ok60::INT),1) p60, round(100*avg(seminfo::INT),1) seminfo,
  round(100*sum(ok60::INT)/sum((NOT seminfo)::INT),1) p60_tratados,
  sum((NOT seminfo)::INT) tratados
  FROM c WHERE ano BETWEEN 2013 AND 2024 GROUP BY ALL ORDER BY tipo, ano""").df().to_string())

print("\n== month, todos, 2017-07..2019-06 ==")
print(db.sql("""SELECT mes, count(*) casos, sum(seminfo::INT) seminfo_n, sum((NOT seminfo)::INT) tratados,
  round(100*avg(seminfo::INT),1) seminfo, round(100*sum(ok60::INT)/sum((NOT seminfo)::INT),1) p60_tratados
  FROM c WHERE tipo='todos' AND mes BETWEEN '201707' AND '201906' GROUP BY ALL ORDER BY mes""").df().to_string())

print("\n== month x type: % no info, 2018-01..2018-09 ==")
print(db.sql("""PIVOT (SELECT tipo, mes, round(100*avg(seminfo::INT),1) v FROM c
  WHERE mes BETWEEN '201801' AND '201809' GROUP BY ALL) ON mes USING first(v) ORDER BY tipo""").df().to_string())

print("\n== modality (TRATAMENTO) share by year, todos ==")
print(db.sql("""PIVOT (SELECT ano, trat, count(*) n FROM c WHERE tipo='todos' AND ano BETWEEN 2014 AND 2024 GROUP BY ALL)
  ON trat USING sum(n) ORDER BY ano""").df().to_string())
