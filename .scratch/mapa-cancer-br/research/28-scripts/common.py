"""Shared definitions for the ticket 28 measurements (same rules as pipeline/sources/painel.py).

Extends 27-scripts/common.py with the treatment month, treating establishment and treating UF.
"""
import duckdb

ALL = [f"C{n:02d}" for n in range(98) if n not in (44, 73) and not 76 <= n <= 80]
TYPES = {
    "todos": ALL,
    "mama": ["C50"],
    "colo": ["C53"],
    "prostata": ["C61"],
    "colorretal": ["C18", "C19", "C20", "C21"],
    "pulmao": ["C33", "C34"],
}

# TabNet's "até 60 dias": +0000..+0060 or -0001..-0090.
WITHIN_60 = """(
  (substr(TEMPO_TRAT,1,1)='+' AND TRY_CAST(substr(TEMPO_TRAT,2) AS INT) <= 60)
  OR (substr(TEMPO_TRAT,1,1)='-' AND TRY_CAST(substr(TEMPO_TRAT,2) AS INT) BETWEEN 1 AND 90))"""


def connect(parquet: str) -> duckdb.DuckDBPyConnection:
    db = duckdb.connect()
    db.execute(f"CREATE VIEW raw AS SELECT * FROM read_parquet('{parquet}')")
    cases = " UNION ALL ".join(
        f"SELECT '{t}' AS tipo, * FROM raw WHERE DIAG_DETH IN ({','.join(repr(c) for c in codes)})"
        for t, codes in TYPES.items()
    )
    db.execute(f"""CREATE TABLE c AS SELECT tipo, DIAG_DETH AS cid, CAST(ANO_DIAGN AS INT) AS ano,
        ANOMES_DIA AS mes, ANOMES_TRA AS mes_tra, UF_RESID AS uf, MUN_RESID AS mun, UF_TRATAM AS uf_tra,
        TRATAMENTO AS trat, CNES_DIAG AS cnes, CNES_TRAT AS cnes_tra, TEMPO_TRAT AS tempo,
        {WITHIN_60} AS ok60, TRATAMENTO='5' AS seminfo FROM ({cases})""")
    return db
