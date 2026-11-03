"""Q4: how the cascade minimum (mean >= 20/year in the window) splits municipalities
into own data / immediate region / insufficient, counting all cases or only chemo/radio cases.

Usage: python -I cascade_origin.py <painel.parquet> <municipalities.json>
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import connect

db = connect(sys.argv[1])
listing = json.load(open(sys.argv[2]))["municipalities"]
region = {m["code"]: m["immediate_region"] for m in listing}
rows = db.sql("""SELECT mun, count(*) n, count(*) FILTER (trat IN ('2','3','4')) qr
  FROM c WHERE tipo='todos' AND ano BETWEEN 2015 AND 2024 GROUP BY mun""").fetchall()
by_mun = {m: (n / 10, qr / 10) for m, n, qr in rows}
by_region = collections.defaultdict(lambda: [0.0, 0.0])
for m, vals in by_mun.items():
    if m in region:
        for i, v in enumerate(vals):
            by_region[region[m]][i] += v
for i, label in enumerate(["todos os casos", "so quimio/radio"]):
    origin = collections.Counter()
    for m in region:
        if by_mun.get(m, (0, 0))[i] >= 20:
            origin["municipio"] += 1
        elif by_region[region[m]][i] >= 20:
            origin["regiao"] += 1
        else:
            origin["insuficiente"] += 1
    print(f"{label:16}", dict(origin))
