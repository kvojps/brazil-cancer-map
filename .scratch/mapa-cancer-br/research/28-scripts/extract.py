"""Extract the Painel-Oncologia fields needed to study the 2024 drop in surgery cases.

Same as 27-scripts/extract.py plus the treating establishment and dates.
Usage: python -I extract.py <dir with POBR*.dbc> <out.parquet>
Keeps every row (all CID groups); filtering happens in the analysis scripts.
The patient's CNS is not extracted.
"""
import glob
import os
import sys
import tempfile

import datasus_dbc
import dbfread
import duckdb
import pandas as pd

FIELDS = ["ANO_DIAGN", "ANOMES_DIA", "ANO_TRATAM", "ANOMES_TRA", "UF_RESID", "MUN_RESID",
          "UF_TRATAM", "MUN_TRATAM", "UF_DIAGN", "MUN_DIAG", "TRATAMENTO", "DIAGNOSTIC",
          "DIAG_DETH", "TEMPO_TRAT", "CNES_DIAG", "CNES_TRAT", "ESTADIAM", "IDADE", "SEXO"]

src, out = sys.argv[1], sys.argv[2]
frames = []
with tempfile.TemporaryDirectory() as work:
    for path in sorted(glob.glob(os.path.join(src, "POBR*.dbc"))):
        dbf = os.path.join(work, os.path.basename(path)[:-4] + ".dbf")
        datasus_dbc.decompress(path, dbf)
        rows = ([r.get(f) or "" for f in FIELDS] for r in dbfread.DBF(dbf, encoding="latin-1"))
        frames.append(pd.DataFrame(rows, columns=FIELDS))
        os.remove(dbf)
        print(path, len(frames[-1]), flush=True)
df = pd.concat(frames, ignore_index=True)
duckdb.sql(f"COPY (SELECT * FROM df) TO '{out}' (FORMAT parquet)")
