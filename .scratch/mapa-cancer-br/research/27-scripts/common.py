"""Shared definitions for the ticket 27 measurements (same rules as pipeline/sources/painel.py)."""
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
    db.execute(f"""CREATE TABLE c AS SELECT tipo, CAST(ANO_DIAGN AS INT) AS ano, ANOMES_DIA AS mes,
        UF_RESID AS uf, MUN_RESID AS mun, TRATAMENTO AS trat, CNES_DIAG AS cnes,
        {WITHIN_60} AS ok60, TRATAMENTO='5' AS seminfo FROM ({cases})""")
    return db
