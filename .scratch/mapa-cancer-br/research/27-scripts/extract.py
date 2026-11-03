"""Extract the Painel-Oncologia fields needed to study the 2018-2019 break.

Usage: python -I extract.py <dir with POBR*.dbc> <out.parquet>
Keeps every row (all CID groups); filtering happens in the analysis scripts.
"""
import glob
import os
import sys
import tempfile

import datasus_dbc
import dbfread
import duckdb
import pandas as pd

FIELDS = ["ANO_DIAGN", "ANOMES_DIA", "UF_RESID", "MUN_RESID", "TRATAMENTO",
          "DIAGNOSTIC", "DIAG_DETH", "TEMPO_TRAT", "CNES_DIAG", "MUN_DIAG", "ANOMES_TRA"]

src, out = sys.argv[1], sys.argv[2]
frames = []
with tempfile.TemporaryDirectory() as work:
    for path in sorted(glob.glob(os.path.join(src, "POBR*.dbc"))):
        dbf = os.path.join(work, os.path.basename(path)[:-4] + ".dbf")
        datasus_dbc.decompress(path, dbf)
        rows = ([r[f] or "" for f in FIELDS] for r in dbfread.DBF(dbf, encoding="latin-1"))
        frames.append(pd.DataFrame(rows, columns=FIELDS))
        os.remove(dbf)
        print(path, len(frames[-1]), flush=True)
df = pd.concat(frames, ignore_index=True)
duckdb.sql(f"COPY (SELECT * FROM df) TO '{out}' (FORMAT parquet)")
