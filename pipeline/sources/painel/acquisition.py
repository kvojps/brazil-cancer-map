"""Decode DBC, count clean cases and acquire/parse official TabNet comparisons."""

import re
import tempfile
import urllib.parse
import urllib.request
from collections.abc import Iterable, Iterator, Mapping, Sequence
from pathlib import Path

import datasus_dbc
import dbfread

from pipeline.download import fetch, list_ftp, with_retries

from .models import (
    CANCER_TYPES,
    CHEMO_RADIO,
    CaseCounts,
    CountKey,
    FirstTreatment,
    MonthKey,
    NO_TREATMENT_INFO,
    PainelCounts,
    SURGERY,
    TABNET_TABLES,
    TREATMENT_ALL_CANCERS,
    UfShare,
)


def is_within_60_days(days: str) -> bool:
    """Whether `TEMPO_TRAT` ("+0045", "-0012") falls in TabNet's "até 60 dias".

    TabNet counts treatment up to 90 days *before* diagnosis as on time, so we
    do too, to match the official figures. Anything else (blank, "9...") is not.
    """
    if len(days) != 5 or not days[1:].isdigit():
        return False
    if days[0] == "+":
        return int(days[1:]) <= 60
    if days[0] == "-":
        return 1 <= int(days[1:]) <= 90
    return False


def first_treatment(code: str) -> FirstTreatment | None:
    if code == SURGERY:
        return FirstTreatment.SURGERY
    if code in CHEMO_RADIO:
        return FirstTreatment.CHEMO_RADIO
    if code == NO_TREATMENT_INFO:
        return FirstTreatment.WITHOUT_INFO
    return None

_YEAR_MONTH = re.compile(r"^(\d{4})(0[1-9]|1[0-2])$")


def count_cases(records: Iterable[Mapping[str, str]]) -> PainelCounts:
    """Count Painel rows by diagnosis year, municipality of residence and cancer type, and,
    nationally for 'Todos', by diagnosis month and first treatment: one pass over the rows."""
    counts: dict[CountKey, CaseCounts] = {}
    months: dict[MonthKey, int] = {}
    for row in records:
        for cancer_type, includes in CANCER_TYPES.items():
            if not includes(row["DIAG_DETH"]):
                continue
            key = (int(row["ANO_DIAGN"]), row["MUN_RESID"], cancer_type)
            entry = counts.setdefault(key, CaseCounts())
            within_60_days = is_within_60_days(row["TEMPO_TRAT"])
            entry.cases += 1
            entry.within_60_days += within_60_days
            entry.without_treatment_info += row["TRATAMENTO"] == NO_TREATMENT_INFO
            if row["TRATAMENTO"] in CHEMO_RADIO:
                entry.chemo_radio += 1
                entry.chemo_radio_within_60_days += within_60_days
        if row["DIAG_DETH"] in TREATMENT_ALL_CANCERS:
            month = _YEAR_MONTH.match(row["ANOMES_DIA"])
            treatment = first_treatment(row["TRATAMENTO"])
            if month and treatment:
                month_key = (f"{month[1]}-{month[2]}", treatment)
                months[month_key] = months.get(month_key, 0) + 1
    return PainelCounts(counts, months)

ON_TIME_COLUMNS = ("30 dias", "31 - 60 dias")
"""Endings of TabNet's "Até 30 dias" and "31 - 60 dias" labels: ASCII, because
the page mixes encodings and "Até" does not survive every decoding."""
WITHOUT_INFO_COLUMN = "Sem inform"
"""Start of TabNet's "Sem informação de tratamento" label, ASCII for the same reason.
TabNet leaves the column out when it is empty, as in the chemo/radio table."""
TOTAL_COLUMN = "Total"
_COLUMN = re.compile(r"data\.addColumn\('(?:string|number)','([^']*)'\)")
_ROW = re.compile(r'\["(\d\d) [^"]*"((?:\s*,\s*\{v:\s*[\d.]+[^}]*\})+)\s*\]')
_VALUE = re.compile(r"\{v:\s*([\d.]+)")


def parse_tabnet(page: str) -> dict[str, UfShare]:
    """Read a TabNet "UF da residência × Tempo Tratamento" table, by UF code.

    The columns are found by their labels, so a reordering of TabNet's columns
    does not misread the page. The total row has no UF code and is skipped.
    """
    columns = [label.strip() for label in _COLUMN.findall(page)][1:]
    on_time = [i for i, c in enumerate(columns) if c.endswith(ON_TIME_COLUMNS)]
    if len(on_time) != len(ON_TIME_COLUMNS) or TOTAL_COLUMN not in columns:
        raise ValueError(f"unexpected TabNet columns: {columns}")
    total = columns.index(TOTAL_COLUMN)
    without_info = next((i for i, c in enumerate(columns) if c.startswith(WITHOUT_INFO_COLUMN)), None)
    shares = {}
    for uf, cells in _ROW.findall(page):
        values = [round(float(v)) for v in _VALUE.findall(cells)]
        if len(values) != len(columns):
            raise ValueError(f"TabNet row for UF {uf} has {len(values)} cells, expected {len(columns)}")
        shares[uf] = UfShare(
            within_60_days=sum(values[i] for i in on_time),
            cases=values[total],
            without_treatment_info=values[without_info] if without_info is not None else 0,
        )
    return shares

FTP_DIR = "ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Dados/"
FILE_NAME = re.compile(r"^POBR(\d{4})\.dbc$", re.IGNORECASE)
FIRST_YEAR = 2014
"""The series starts in 2014 (spec, section 5); 2013, the Painel's first year, stays out."""

TABNET_URL = "http://tabnet.datasus.gov.br/cgi/webtabx.exe?PAINEL_ONCO/PAINEL_ONCOLOGIABR.def"

FIELDS = ("ANO_DIAGN", "ANOMES_DIA", "MUN_RESID", "DIAG_DETH", "TRATAMENTO", "TEMPO_TRAT")


def tabnet_query(year: int, modalities: Sequence[str] = ()) -> bytes:
    """TabNet form: cases by UF of residence × treatment time, 'Todos' for treatment,
    one year, optionally only some therapeutic modalities."""
    fields = [
        ("Linha", "UF da residência|fato.CO_UF_RESIDENCIA|1|territorio\\br_uf.cnv"),
        (
            "Coluna",
            "Tempo Tratamento|nvl(fato.CO_TEMPO_TRATAMENTO,'     ')|1|PAINEL_ONCO/TEMPO_TRATAMENTO.CNV",
        ),
        ("Incremento", "Casos|= count(*)"),
        ("PAno do diagnóstico", f"{year}|{year}|4"),
        *(("XDiagnóstico Detalhado", f"{cid}|{cid}|3") for cid in sorted(TREATMENT_ALL_CANCERS)),
        *(("XModalidade Terapêutica", modality) for modality in modalities),
        ("formato", "prn"),
        ("mostre", "Mostra"),
    ]
    return urllib.parse.urlencode(fields, encoding="latin-1").encode("ascii")


def fetch_tabnet(year: int, dest: Path, modalities: Sequence[str] = ()) -> None:
    """Save TabNet's table for one diagnosis year. TabNet answers queries, not files: no cache."""

    def query() -> bytes:
        request = urllib.request.Request(TABNET_URL, data=tabnet_query(year, modalities))
        with urllib.request.urlopen(request, timeout=300) as response:
            page: bytes = response.read()
        parse_tabnet(page.decode("latin-1"))  # fail here, not at validation, on an error page
        return page

    page = with_retries(query, f"query TabNet for {year}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(page)


def read_dbc(path: Path) -> Iterator[dict[str, str]]:
    """The fields the Painel source uses, row by row, from a DATASUS DBC file."""
    with tempfile.TemporaryDirectory() as workdir:
        dbf = Path(workdir) / (path.stem + ".dbf")
        datasus_dbc.decompress(str(path), str(dbf))
        for row in dbfread.DBF(str(dbf), encoding="latin-1", char_decode_errors="replace"):
            yield {field: row[field] or "" for field in FIELDS}


def download(raw_dir: Path) -> None:
    """Acquire the diagnosis years and both official comparison tables."""
    years = sorted(
        int(match[1]) for name in list_ftp(FTP_DIR) if (match := FILE_NAME.match(name))
    )
    for year in years:
        if year >= FIRST_YEAR:
            fetch(f"{FTP_DIR}POBR{year}.dbc", raw_dir / f"POBR{year}.dbc")
            for table in TABNET_TABLES:
                page = raw_dir / "tabnet" / table.directory / f"{year}.html"
                fetch_tabnet(year, page, table.modalities)
