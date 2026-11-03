"""Painel-Oncologia: % of cases treated within 60 days of diagnosis, by municipality of residence."""

import json
import re
import tempfile
import time
import urllib.parse
import urllib.request
from collections.abc import Callable, Iterable, Iterator, Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import datasus_dbc
import dbfread
import duckdb

from pipeline.download import DownloadError, fetch, list_ftp
from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.trend import quasi_poisson_trend, trend_window

TREATMENT_ALL_CANCERS = frozenset(
    f"C{n:02d}" for n in range(98) if n != 44 and n != 73 and not 76 <= n <= 80
)
"""'Todos os cânceres' in the treatment axis: C00–C97 without C44, C73 and C76–C80 (spec, section 5)."""

CANCER_TYPES: dict[str, Callable[[str], bool]] = {
    "all": TREATMENT_ALL_CANCERS.__contains__,
}
"""Cancer type → whether a 3-character ICD-10 code (`DIAG_DETH`) belongs to it."""


NO_TREATMENT_INFO = "5"
"""`TRATAMENTO` code for "sem informação de tratamento"."""


@dataclass
class CaseCounts:
    cases: int = 0
    """Cases diagnosed: the denominator of both shares."""
    within_60_days: int = 0
    """First treatment within 60 days of diagnosis."""
    without_treatment_info: int = 0


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


CountKey = tuple[int, str, str]
"""(diagnosis year, municipality of residence, cancer type)."""


def count_cases(records: Iterable[Mapping[str, str]]) -> dict[CountKey, CaseCounts]:
    """Count Painel rows by diagnosis year, municipality of residence and cancer type."""
    counts: dict[CountKey, CaseCounts] = {}
    for row in records:
        for cancer_type, includes in CANCER_TYPES.items():
            if not includes(row["DIAG_DETH"]):
                continue
            key = (int(row["ANO_DIAGN"]), row["MUN_RESID"], cancer_type)
            entry = counts.setdefault(key, CaseCounts())
            entry.cases += 1
            entry.within_60_days += is_within_60_days(row["TEMPO_TRAT"])
            entry.without_treatment_info += row["TRATAMENTO"] == NO_TREATMENT_INFO
    return counts


PROVISIONAL_YEARS = 2
"""The latest diagnosis years are still filling in treatment records (spec, section 6.4)."""


def provisional_years(years: Iterable[int]) -> set[int]:
    """The 2 latest diagnosis years in the data, which stay provisional."""
    return set(sorted(set(years))[-PROVISIONAL_YEARS:])


def within_60_days_layer(
    counts: Mapping[tuple[int, str], CaseCounts],
    *,
    municipalities: Sequence[str],
    provisional: set[int],
) -> dict[str, Any]:
    """The map layer of one cancer type: each municipality's trend and latest shares.

    `counts` is keyed by (diagnosis year, municipality). Every municipality of
    the mesh is in the layer; codes outside it (unknown residence) are ignored.
    """
    years = sorted({year for year, _ in counts})
    window = trend_window(years, provisional)
    if window is None:
        raise ValueError("no consolidated diagnosis year to publish")
    latest = window[1]
    by_municipality: dict[str, dict[int, CaseCounts]] = {code: {} for code in municipalities}
    for (year, code), entry in counts.items():
        if code in by_municipality:
            by_municipality[code][year] = entry

    layer = {}
    for code, series in by_municipality.items():
        trend = quasi_poisson_trend(
            years,
            [series[y].within_60_days if y in series else 0 for y in years],
            [series[y].cases if y in series else 0 for y in years],
            provisional=provisional,
            higher_is_better=True,
        )
        last = series.get(latest, CaseCounts())
        layer[code] = {
            "origin": "municipality" if trend else "insufficient",
            "trend": trend.trend_class.value if trend else None,
            "value": _percent(last.within_60_days, last.cases),
            "without_treatment_info": _percent(last.without_treatment_info, last.cases),
        }
    period = {
        "first_year": years[0],
        "last_year": years[-1],
        "provisional": sorted(provisional & set(years)),
        "latest": latest,
        "trend": list(window),
    }
    return {"period": period, "municipalities": layer}


def _percent(count: int, cases: int) -> float | None:
    """A count as a share of the year's cases, in percent with one decimal."""
    return round(100 * count / cases, 1) if cases else None


@dataclass(frozen=True)
class TabnetShare:
    """TabNet's count of cases and of those treated within 60 days, for one UF."""

    within_60_days: int
    cases: int


ON_TIME_COLUMNS = ("30 dias", "31 - 60 dias")
"""Endings of TabNet's "Até 30 dias" and "31 - 60 dias" labels: ASCII, because
the page mixes encodings and "Até" does not survive every decoding."""
TOTAL_COLUMN = "Total"
_COLUMN = re.compile(r"data\.addColumn\('(?:string|number)','([^']*)'\)")
_ROW = re.compile(r'\["(\d\d) [^"]*"((?:\s*,\s*\{v:\s*[\d.]+[^}]*\})+)\s*\]')
_VALUE = re.compile(r"\{v:\s*([\d.]+)")


def parse_tabnet(page: str) -> dict[str, TabnetShare]:
    """Read a TabNet "UF da residência × Tempo Tratamento" table, by UF code.

    The columns are found by their labels, so a reordering of TabNet's columns
    does not misread the page. The total row has no UF code and is skipped.
    """
    columns = [label.strip() for label in _COLUMN.findall(page)][1:]
    on_time = [i for i, c in enumerate(columns) if c.endswith(ON_TIME_COLUMNS)]
    if len(on_time) != len(ON_TIME_COLUMNS) or TOTAL_COLUMN not in columns:
        raise ValueError(f"unexpected TabNet columns: {columns}")
    total = columns.index(TOTAL_COLUMN)
    shares = {}
    for uf, cells in _ROW.findall(page):
        values = [round(float(v)) for v in _VALUE.findall(cells)]
        if len(values) != len(columns):
            raise ValueError(f"TabNet row for UF {uf} has {len(values)} cells, expected {len(columns)}")
        shares[uf] = TabnetShare(within_60_days=sum(values[i] for i in on_time), cases=values[total])
    return shares


TABNET_TOLERANCE = 0.5
"""Largest gap, in percentage points, between our % within 60 days and TabNet's for a UF.
TabNet and the FTP files are refreshed on different days of the month."""


def compare_with_tabnet(
    ours: Mapping[str, TabnetShare], official: Mapping[str, TabnetShare], *, year: int
) -> list[str]:
    """Problems found comparing the % within 60 days by UF with TabNet's, for one year."""
    problems = []
    for uf, expected in sorted(official.items()):
        if expected.cases == 0:
            continue
        got = ours.get(uf)
        if got is None or got.cases == 0:
            problems.append(f"{year}, UF {uf}: TabNet has {expected.cases} cases, we have none")
            continue
        theirs = 100 * expected.within_60_days / expected.cases
        mine = 100 * got.within_60_days / got.cases
        if abs(mine - theirs) > TABNET_TOLERANCE:
            problems.append(f"{year}, UF {uf}: {mine:.1f}% within 60 days, TabNet {theirs:.1f}%")
    return problems


FTP_DIR = "ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Dados/"
FILE_NAME = re.compile(r"^POBR(\d{4})\.dbc$", re.IGNORECASE)
FIRST_YEAR = 2014
"""The series starts in 2014 (spec, section 5); 2013, the Painel's first year, stays out."""

TABNET_URL = "http://tabnet.datasus.gov.br/cgi/webtabx.exe?PAINEL_ONCO/PAINEL_ONCOLOGIABR.def"

SOURCE = {
    "name": "Painel-Oncologia (DATASUS/Ministério da Saúde)",
    "url": FTP_DIR,
    "conditions": (
        "Dados abertos do Ministério da Saúde (DATASUS), com citação da fonte. "
        "Dicionário e nota técnica: ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Doc/"
    ),
}
"""Attribution carried by every exported file (spec, section 2)."""

INDICATOR = "within_60_days"
FIELDS = ("ANO_DIAGN", "MUN_RESID", "DIAG_DETH", "TRATAMENTO", "TEMPO_TRAT")


class PainelValidationError(Exception):
    pass


def tabnet_query(year: int) -> bytes:
    """TabNet form: cases by UF of residence × treatment time, 'Todos' for treatment, one year."""
    fields = [
        ("Linha", "UF da residência|fato.CO_UF_RESIDENCIA|1|territorio\\br_uf.cnv"),
        (
            "Coluna",
            "Tempo Tratamento|nvl(fato.CO_TEMPO_TRATAMENTO,'     ')|1|PAINEL_ONCO/TEMPO_TRATAMENTO.CNV",
        ),
        ("Incremento", "Casos|= count(*)"),
        ("PAno do diagnóstico", f"{year}|{year}|4"),
        *(("XDiagnóstico Detalhado", f"{cid}|{cid}|3") for cid in sorted(TREATMENT_ALL_CANCERS)),
        ("formato", "prn"),
        ("mostre", "Mostra"),
    ]
    return urllib.parse.urlencode(fields, encoding="latin-1").encode("ascii")


def fetch_tabnet(year: int, dest: Path, *, attempts: int = 4) -> None:
    """Save TabNet's table for one diagnosis year. TabNet answers queries, not files: no cache."""
    last_error: Exception | None = None
    for attempt in range(attempts):
        if attempt > 0:
            time.sleep(2.0**attempt)
        try:
            request = urllib.request.Request(TABNET_URL, data=tabnet_query(year))
            with urllib.request.urlopen(request, timeout=300) as response:
                page = response.read()
            parse_tabnet(page.decode("latin-1"))  # fail here, not at validation, on an error page
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(page)
            return
        except Exception as error:
            last_error = error
    raise DownloadError(f"could not query TabNet for {year} after {attempts} attempts: {last_error}")


def write_clean(clean_dir: Path, counts: Mapping[CountKey, CaseCounts], *, extracted_at: str) -> None:
    """Write the standardized counts as Parquet, marking the provisional years."""
    provisional = provisional_years(year for year, _, _ in counts)
    clean_dir.mkdir(parents=True, exist_ok=True)
    with duckdb.connect() as db:
        db.execute(
            "CREATE TABLE cases (year INTEGER, municipality VARCHAR, cancer_type VARCHAR,"
            " provisional BOOLEAN, cases INTEGER, within_60_days INTEGER, without_treatment_info INTEGER)"
        )
        db.executemany(
            "INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                (year, code, cancer_type, year in provisional, c.cases, c.within_60_days, c.without_treatment_info)
                for (year, code, cancer_type), c in sorted(counts.items())
            ],
        )
        db.execute(f"COPY cases TO '{clean_dir / 'cases.parquet'}' (FORMAT parquet)")
    (clean_dir / "extract.json").write_text(json.dumps({"extracted_at": extracted_at}))


def read_clean(clean_dir: Path) -> list[tuple[int, str, str, bool, int, int, int]]:
    with duckdb.connect() as db:
        rows = db.execute(
            "SELECT year, municipality, cancer_type, provisional, cases, within_60_days,"
            " without_treatment_info FROM read_parquet(?)",
            [str(clean_dir / "cases.parquet")],
        ).fetchall()
    return [tuple(row) for row in rows]


class PainelSource:
    """% of cases treated within 60 days, and % without treatment information."""

    name = "painel"

    def __init__(
        self,
        *,
        raw_dir: Path = RAW_DIR / "painel",
        clean_dir: Path = CLEAN_DIR / "painel",
        site_data_dir: Path = SITE_DATA_DIR,
    ) -> None:
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir
        self._site_data_dir = site_data_dir

    def download(self) -> None:
        years = sorted(
            int(match[1]) for name in list_ftp(FTP_DIR) if (match := FILE_NAME.match(name))
        )
        for year in years:
            if year >= FIRST_YEAR:
                fetch(f"{FTP_DIR}POBR{year}.dbc", self._raw_dir / f"POBR{year}.dbc")
                fetch_tabnet(year, self._raw_dir / "tabnet" / f"{year}.html")

    def clean(self) -> None:
        files = sorted(
            path for path in self._raw_dir.glob("POBR*.dbc")
            if (match := FILE_NAME.match(path.name)) and int(match[1]) >= FIRST_YEAR
        )
        if not files:
            raise FileNotFoundError(f"no POBR*.dbc in {self._raw_dir}: run the download step")
        counts: dict[CountKey, CaseCounts] = {}
        for path in files:
            for key, entry in count_cases(_read_dbc(path)).items():
                total = counts.setdefault(key, CaseCounts())
                total.cases += entry.cases
                total.within_60_days += entry.within_60_days
                total.without_treatment_info += entry.without_treatment_info
        # DATASUS rewrites every file each month; the newest file date is the extract's.
        written = max(path.stat().st_mtime for path in files)
        extracted_at = datetime.fromtimestamp(written, UTC).date().isoformat()
        write_clean(self._clean_dir, counts, extracted_at=extracted_at)

    def compute(self) -> None:
        rows = read_clean(self._clean_dir)
        provisional = {year for year, *_, is_provisional, _, _, _ in rows if is_provisional}
        municipalities = self._municipalities()
        for cancer_type in CANCER_TYPES:
            counts = {
                (year, code): CaseCounts(cases, within, without)
                for year, code, kind, _, cases, within, without in rows
                if kind == cancer_type
            }
            layer = within_60_days_layer(counts, municipalities=municipalities, provisional=provisional)
            path = self._clean_dir / "layers" / f"{cancer_type}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(layer))

    def validate(self) -> None:
        """Compare the % within 60 days by UF with TabNet, year by year, and check the layers."""
        ours: dict[int, dict[str, TabnetShare]] = {}
        for year, code, kind, _, cases, within, _ in read_clean(self._clean_dir):
            if kind == "all":
                by_uf = ours.setdefault(year, {})
                previous = by_uf.get(code[:2], TabnetShare(0, 0))
                by_uf[code[:2]] = TabnetShare(previous.within_60_days + within, previous.cases + cases)

        problems = []
        for year in sorted(ours):
            page = self._raw_dir / "tabnet" / f"{year}.html"
            if not page.exists():
                problems.append(f"{year}: no TabNet table to compare with")
                continue
            problems += compare_with_tabnet(ours[year], parse_tabnet(page.read_text("latin-1")), year=year)

        expected = set(self._municipalities())
        for cancer_type in CANCER_TYPES:
            layer = self._layer(cancer_type)
            if layer["municipalities"].keys() != expected:
                problems.append(f"layer '{cancer_type}' does not cover the mesh's municipalities")
        if problems:
            raise PainelValidationError("; ".join(problems))

    def export(self) -> None:
        """Publish the map layers and the manifest, only if the validation passes."""
        self.validate()
        extract = json.loads((self._clean_dir / "extract.json").read_text())
        files: dict[str, object] = {}
        periods = {}
        for cancer_type in CANCER_TYPES:
            layer = self._layer(cancer_type)
            periods[cancer_type] = layer["period"]
            files[f"map/{INDICATOR}/{cancer_type}.json"] = {
                "indicator": INDICATOR,
                "cancer_type": cancer_type,
                "source": {**SOURCE, "period": _period_text(layer["period"])},
                **layer,
            }
        files[MANIFEST] = updated_manifest(
            self._site_data_dir,
            source="painel_oncologia",
            extract={"name": SOURCE["name"], **extract},
            indicators={INDICATOR: periods},
        )
        publish_together(self._site_data_dir, files)

    def _municipalities(self) -> list[str]:
        listing = json.loads((self._site_data_dir / "municipalities.json").read_text())
        return [m["code"] for m in listing["municipalities"]]

    def _layer(self, cancer_type: str) -> dict[str, Any]:
        layer: dict[str, Any] = json.loads((self._clean_dir / "layers" / f"{cancer_type}.json").read_text())
        return layer


def _period_text(period: Mapping[str, Any]) -> str:
    first, last = period["first_year"], period["last_year"]
    provisional = ", ".join(str(y) for y in period["provisional"])
    return f"Anos de diagnóstico {first}–{last} ({provisional} provisórios)"


def _read_dbc(path: Path) -> Iterator[dict[str, str]]:
    """The fields the Painel source uses, row by row, from a DATASUS DBC file."""
    with tempfile.TemporaryDirectory() as workdir:
        dbf = Path(workdir) / (path.stem + ".dbf")
        datasus_dbc.decompress(str(path), str(dbf))
        for row in dbfread.DBF(str(dbf), encoding="latin-1", char_decode_errors="replace"):
            yield {field: row[field] or "" for field in FIELDS}
