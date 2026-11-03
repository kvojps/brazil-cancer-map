"""Painel-Oncologia: % of cases treated within 60 days of diagnosis, by municipality of residence."""

import json
import re
import statistics
import sys
import tempfile
import urllib.parse
import urllib.request
from collections.abc import Callable, Iterable, Iterator, Mapping, Sequence
from dataclasses import astuple, dataclass
from datetime import UTC, datetime
from enum import StrEnum
from pathlib import Path
from typing import Any, NamedTuple

import datasus_dbc
import dbfread
import duckdb

from pipeline.status import classify_status, status_note
from pipeline.cascade import Origin, data_origins
from pipeline.download import fetch, list_ftp, with_retries
from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.trend import quasi_poisson_trend, trend_window

TREATMENT_ALL_CANCERS = frozenset(
    f"C{n:02d}" for n in range(98) if n != 44 and n != 73 and not 76 <= n <= 80
)
"""'Todos os cânceres' in the treatment axis: C00–C97 without C44, C73 and C76–C80 (spec, section 5)."""

CANCER_TYPES: dict[str, Callable[[str], bool]] = {
    "all": TREATMENT_ALL_CANCERS.__contains__,
    "breast": frozenset({"C50"}).__contains__,
    "cervix": frozenset({"C53"}).__contains__,
    "prostate": frozenset({"C61"}).__contains__,
    "colorectal": frozenset({"C18", "C19", "C20", "C21"}).__contains__,
    "lung": frozenset({"C33", "C34"}).__contains__,
}
"""Cancer type → whether a 3-character ICD-10 code (`DIAG_DETH`) belongs to it:
"Todos os cânceres" and the 5 types of the selector (spec, sections 3 and 5)."""


WITHOUT_STATUS = frozenset({"prostate"})
"""Cancer types whose 60 dias has no Situação, only the Tendência: in prostate cancer,
active surveillance is correct care, so a late start is not a failure of access
(spec, sections 5 and 6.3)."""


NO_TREATMENT_INFO = "5"
"""`TRATAMENTO` code for "sem informação de tratamento"."""

CHEMO_RADIO = frozenset({"2", "3", "4"})
"""`TRATAMENTO` codes of a first treatment by chemotherapy, radiotherapy or both.
Their registry (APAC) did not change in the Painel's 2018, 2019 and 2024 breaks,
so the trend is measured on these cases only (spec, section 7)."""


@dataclass
class CaseCounts:
    cases: int = 0
    """Cases diagnosed: the denominator of the % without information."""
    within_60_days: int = 0
    """First treatment within 60 days of diagnosis."""
    without_treatment_info: int = 0
    chemo_radio: int = 0
    """Cases first treated with chemotherapy, radiotherapy or both: value and trend denominator."""
    chemo_radio_within_60_days: int = 0
    """Of those, the ones treated within 60 days: value and trend numerator."""

    def __add__(self, other: "CaseCounts") -> "CaseCounts":
        return CaseCounts(*(a + b for a, b in zip(astuple(self), astuple(other), strict=True)))


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


class FirstTreatment(StrEnum):
    """How the case was first treated, as the monthly watch groups `TRATAMENTO`."""

    SURGERY = "surgery"
    CHEMO_RADIO = "chemo_radio"
    WITHOUT_INFO = "without_treatment_info"


SURGERY = "1"
"""`TRATAMENTO` code for a first treatment by surgery."""


def first_treatment(code: str) -> FirstTreatment | None:
    if code == SURGERY:
        return FirstTreatment.SURGERY
    if code in CHEMO_RADIO:
        return FirstTreatment.CHEMO_RADIO
    if code == NO_TREATMENT_INFO:
        return FirstTreatment.WITHOUT_INFO
    return None


MonthKey = tuple[str, FirstTreatment]
"""(diagnosis month as "YYYY-MM", first treatment)."""

_YEAR_MONTH = re.compile(r"^(\d{4})(0[1-9]|1[0-2])$")


@dataclass
class PainelCounts:
    by_municipality: dict[CountKey, CaseCounts]
    by_month: dict[MonthKey, int]
    """National 'Todos' cases by diagnosis month and first treatment, to watch for registry breaks."""


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


MEASURED_CASES = "chemo_radio"
"""The cases the trend and the value are measured on, stated in the layer's period."""

PROVISIONAL_YEARS = 2
"""The latest diagnosis years are still filling in treatment records (spec, section 6.4)."""


def provisional_years(years: Iterable[int]) -> set[int]:
    """The 2 latest diagnosis years in the data, which stay provisional."""
    return set(sorted(set(years))[-PROVISIONAL_YEARS:])


def within_60_days_layer(
    counts: Mapping[tuple[int, str], CaseCounts],
    *,
    immediate_region_of: Mapping[str, str],
    provisional: set[int],
    cancer_type: str = "all",
) -> dict[str, Any]:
    """The map layer of one cancer type: each municipality's trend and latest shares.

    The trend and the value of the latest consolidated year are measured on the
    chemo/radio cases only, a series the Painel's 2018 and 2024 breaks leave
    untouched; the % without treatment information is over all the cases of that
    year, as TabNet shows it (spec, sections 6.3, 7 and 9).

    A municipality below the minimum of chemo/radio cases shows its immediate
    region's trend and shares, or none at all (spec, section 8).

    Every municipality also carries its UF's quality band, from the % of all the
    cases without treatment information over the last 5 consolidated years
    (spec, section 6.3); `quality` gives each UF's band and share.

    `counts` is keyed by (diagnosis year, municipality). `immediate_region_of` maps every
    municipality of the mesh to its immediate region: all of them are in the
    layer, and codes outside it (unknown residence) are ignored.
    """
    years = sorted({year for year, _ in counts})
    window = trend_window(years, provisional)
    if window is None:
        raise ValueError("no consolidated diagnosis year to publish")
    first, latest = window
    by_municipality: dict[str, dict[int, CaseCounts]] = {code: {} for code in immediate_region_of}
    by_immediate_region: dict[str, dict[int, CaseCounts]] = {region: {} for region in immediate_region_of.values()}
    for (year, code), entry in counts.items():
        if code in by_municipality:
            by_municipality[code][year] = entry
            regional = by_immediate_region[immediate_region_of[code]]
            regional[year] = regional.get(year, CaseCounts()) + entry

    origins = data_origins(
        {
            code: sum(entry.chemo_radio for year, entry in series.items() if first <= year <= latest)
            for code, series in by_municipality.items()
        },
        immediate_region_of,
        years=latest - first + 1,
    )
    consolidated = [year for year in years if year not in provisional]
    quality_window = (consolidated[-QUALITY_YEARS:][0], latest)
    quality = uf_quality(counts, {code[:2] for code in immediate_region_of}, quality_window)
    regional_shown: dict[str, dict[str, Any]] = {}
    layer = {}
    for code, origin in origins.items():
        if origin is Origin.MUNICIPALITY:
            shown = _trend_and_shares(by_municipality[code], years, latest, provisional)
        elif origin is Origin.IMMEDIATE_REGION:
            region = immediate_region_of[code]
            if region not in regional_shown:
                regional_shown[region] = _trend_and_shares(by_immediate_region[region], years, latest, provisional)
            shown = regional_shown[region]
        else:
            shown = NO_DATA
        layer[code] = {
            "origin": origin.value,
            **shown,
            "quality_band": quality[code[:2]]["band"],
            "status": shown["status"] if cancer_type not in WITHOUT_STATUS else None,
            "status_note": shown["status_note"] if cancer_type not in WITHOUT_STATUS else None,
        }
    period = {
        "first_year": years[0],
        "last_year": years[-1],
        "provisional": sorted(provisional & set(years)),
        "latest": latest,
        "trend": list(window),
        "trend_cases": MEASURED_CASES,
        "value_cases": MEASURED_CASES,
        "quality_years": list(quality_window),
    }
    return {
        "period": period,
        "quality": quality,
        "municipalities": layer,
        "reference": {"value": 100, "label": "o que a lei garante"} if cancer_type not in WITHOUT_STATUS else None,
    }


QUALITY_YEARS = 5
"""The quality band looks at the last 5 consolidated years (spec, section 6.3)."""


class QualityBand(StrEnum):
    """Quality of the treatment records of a UF × cancer type (spec, section 6.3)."""

    A = "A"
    B = "B"
    C = "C"


def quality_band(without_treatment_info: int, cases: int) -> QualityBand | None:
    """A, B or C from the share of cases without treatment information (spec, section 6.3):
    A up to 15%, B above 15% and below 35%, C from 35%. Compared exactly, not rounded."""
    if not cases:
        return None
    if 100 * without_treatment_info <= 15 * cases:
        return QualityBand.A
    if 100 * without_treatment_info < 35 * cases:
        return QualityBand.B
    return QualityBand.C


def uf_quality(
    counts: Mapping[tuple[int, str], CaseCounts], ufs: Iterable[str], window: tuple[int, int]
) -> dict[str, dict[str, Any]]:
    """Each UF's quality band and % without treatment information, pooling all the cases
    diagnosed in the window, by UF of residence. Cases with an unknown municipality of
    residence still count for their UF, as in TabNet."""
    first, last = window
    pooled = {uf: CaseCounts() for uf in sorted(ufs)}
    for (year, code), entry in counts.items():
        uf = code[:2]
        if uf in pooled and first <= year <= last:
            pooled[uf] += entry
    return {
        uf: {
            "band": quality_band(total.without_treatment_info, total.cases),
            "without_treatment_info": _percent(total.without_treatment_info, total.cases),
        }
        for uf, total in pooled.items()
    }


NO_DATA = {"status": None, "status_note": None, "trend": None, "value": None, "without_treatment_info": None}
"""An insufficient municipality exports neither a class nor shares that would reveal its few cases."""


def _trend_and_shares(series: Mapping[int, CaseCounts], years: Sequence[int], latest: int, provisional: set[int]) -> dict[str, Any]:
    """The trend class and latest shares of a municipality's or a region's series."""
    trend = quasi_poisson_trend(
        years,
        [series[y].chemo_radio_within_60_days if y in series else 0 for y in years],
        [series[y].chemo_radio if y in series else 0 for y in years],
        provisional=provisional,
        higher_is_better=True,
    )
    last = series.get(latest, CaseCounts())
    raw_value = 100 * last.chemo_radio_within_60_days / last.chemo_radio if last.chemo_radio else None
    return {
        "status": classify_status(raw_value, reference=100),
        "status_note": status_note(raw_value, maximum=100),
        "trend": trend.trend_class.value if trend else None,
        "value": _percent(last.chemo_radio_within_60_days, last.chemo_radio),
        "without_treatment_info": _percent(last.without_treatment_info, last.cases),
    }


def _percent(count: int, cases: int) -> float | None:
    """A count as a share of the year's cases, in percent with one decimal."""
    return round(100 * count / cases, 1) if cases else None


@dataclass(frozen=True)
class UfShare:
    """Cases, those treated within 60 days and those without treatment information, in one UF:
    TabNet's or ours."""

    within_60_days: int
    cases: int
    without_treatment_info: int = 0


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


TABNET_TOLERANCE = 0.5
"""Largest gap, in percentage points, between our shares and TabNet's for a UF.
TabNet and the FTP files are refreshed on different days of the month."""

TABNET_CASES_TOLERANCE = 0.01
"""Largest relative gap between our number of cases and TabNet's for a UF, for the same reason."""


def compare_with_tabnet(
    ours: Mapping[str, UfShare], official: Mapping[str, UfShare], *, year: int
) -> list[str]:
    """Problems found comparing, by UF and for one year, the number of cases, the % within
    60 days and the % without treatment information with TabNet's."""
    problems = []
    for uf, expected in sorted(official.items()):
        if expected.cases == 0:
            continue
        got = ours.get(uf)
        if got is None or got.cases == 0:
            problems.append(f"{year}, UF {uf}: TabNet has {expected.cases} cases, we have none")
            continue
        if abs(got.cases - expected.cases) > TABNET_CASES_TOLERANCE * expected.cases:
            problems.append(f"{year}, UF {uf}: {got.cases} cases, TabNet {expected.cases}")
        for label, mine, theirs in (
            ("within 60 days", got.within_60_days, expected.within_60_days),
            ("without treatment information", got.without_treatment_info, expected.without_treatment_info),
        ):
            mine_share = 100 * mine / got.cases
            their_share = 100 * theirs / expected.cases
            if abs(mine_share - their_share) > TABNET_TOLERANCE:
                problems.append(f"{year}, UF {uf}: {mine_share:.1f}% {label}, TabNet {their_share:.1f}%")
    return problems


FTP_DIR = "ftp://ftp.datasus.gov.br/dissemin/publicos/painel_oncologia/Dados/"
FILE_NAME = re.compile(r"^POBR(\d{4})\.dbc$", re.IGNORECASE)
FIRST_YEAR = 2014
"""The series starts in 2014 (spec, section 5); 2013, the Painel's first year, stays out."""

TABNET_CANCER_TYPE = "all"
"""The TabNet query reproduces 'Todos' for treatment, so it checks that cancer type."""

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
FIELDS = ("ANO_DIAGN", "ANOMES_DIA", "MUN_RESID", "DIAG_DETH", "TRATAMENTO", "TEMPO_TRAT")


class PainelValidationError(Exception):
    pass


class TabnetTable(NamedTuple):
    """One TabNet comparison: which cases it covers, and where it is saved under `raw/painel/tabnet/`."""

    label: str
    directory: str
    modalities: tuple[str, ...]
    """`Modalidade Terapêutica` filter values; empty means every case."""


TABNET_TABLES = (
    TabnetTable("all cases", "", ()),
    TabnetTable(
        "chemotherapy or radiotherapy",
        "chemo_radio",
        ("QUIMIOTERAPIA|2|1", "RADIOTERAPIA|3|1", "AMBOS|4|1"),
    ),
)
"""The chemo/radio cases (`TRATAMENTO` 2, 3 or 4) check the value and the trend's series;
all the cases check the % without treatment information and the case counts."""


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


def write_clean(
    clean_dir: Path,
    counts: Mapping[CountKey, CaseCounts],
    months: Mapping[MonthKey, int],
    *,
    extracted_at: str,
) -> None:
    """Write the standardized counts as Parquet, marking the provisional years, and the
    national monthly counts by first treatment."""
    provisional = provisional_years(year for year, _, _ in counts)
    clean_dir.mkdir(parents=True, exist_ok=True)
    with duckdb.connect() as db:
        db.execute(
            "CREATE TABLE cases (year INTEGER, municipality VARCHAR, cancer_type VARCHAR,"
            " provisional BOOLEAN, cases INTEGER, within_60_days INTEGER, without_treatment_info INTEGER,"
            " chemo_radio INTEGER, chemo_radio_within_60_days INTEGER)"
        )
        db.executemany(
            "INSERT INTO cases VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    year, code, cancer_type, year in provisional, c.cases, c.within_60_days,
                    c.without_treatment_info, c.chemo_radio, c.chemo_radio_within_60_days,
                )
                for (year, code, cancer_type), c in sorted(counts.items())
            ],
        )
        db.execute(f"COPY cases TO '{clean_dir / 'cases.parquet'}' (FORMAT parquet)")
        db.execute("CREATE TABLE months (month VARCHAR, first_treatment VARCHAR, cases INTEGER)")
        db.executemany(
            "INSERT INTO months VALUES (?, ?, ?)",
            [(month, treatment.value, n) for (month, treatment), n in sorted(months.items())],
        )
        db.execute(f"COPY months TO '{clean_dir / 'months.parquet'}' (FORMAT parquet)")
    (clean_dir / "extract.json").write_text(json.dumps({"extracted_at": extracted_at}))


class CleanRow(NamedTuple):
    """One row of the standardized Painel table."""

    year: int
    municipality: str
    cancer_type: str
    provisional: bool
    cases: int
    within_60_days: int
    without_treatment_info: int
    chemo_radio: int
    chemo_radio_within_60_days: int

    @property
    def counts(self) -> CaseCounts:
        return CaseCounts(
            self.cases,
            self.within_60_days,
            self.without_treatment_info,
            self.chemo_radio,
            self.chemo_radio_within_60_days,
        )


def read_clean(clean_dir: Path) -> list[CleanRow]:
    with duckdb.connect() as db:
        rows = db.execute(
            "SELECT year, municipality, cancer_type, provisional, cases, within_60_days,"
            " without_treatment_info, chemo_radio, chemo_radio_within_60_days FROM read_parquet(?)",
            [str(clean_dir / "cases.parquet")],
        ).fetchall()
    return [CleanRow(*row) for row in rows]


def read_months(clean_dir: Path) -> dict[MonthKey, int]:
    with duckdb.connect() as db:
        rows = db.execute(
            "SELECT month, first_treatment, cases FROM read_parquet(?)", [str(clean_dir / "months.parquet")]
        ).fetchall()
    return {(month, FirstTreatment(treatment)): n for month, treatment, n in rows}


DROP_SHARE = 0.75
"""A month below this share of the median of the 12 months before it has dropped to a new level."""

WATCH_MONTHS = 12


def monthly_drops(months: Mapping[MonthKey, int], *, provisional: set[int]) -> list[str]:
    """Alerts for the months whose cases of a first treatment fell far below the median of the
    12 months before, as the surgeries did from April 2024 (spec, section 14). Months of the
    provisional years are still filling in and are not watched."""
    if not months:
        return []
    observed = sorted({month for month, _ in months})
    first_year, first_month = map(int, observed[0].split("-"))
    last_year, last_month = map(int, observed[-1].split("-"))
    calendar = [
        f"{index // 12:04d}-{index % 12 + 1:02d}"
        for index in range(first_year * 12 + first_month - 1, last_year * 12 + last_month)
    ]
    alerts = []
    for treatment in FirstTreatment:
        series = [months.get((month, treatment), 0) for month in calendar]
        for i in range(WATCH_MONTHS, len(calendar)):
            month, cases = calendar[i], series[i]
            if int(month[:4]) in provisional:
                continue
            reference = statistics.median(series[i - WATCH_MONTHS : i])
            if cases < DROP_SHARE * reference:
                alerts.append(
                    f"{treatment.value}, {month}: {cases} cases, {cases / reference:.0%} of the median "
                    f"of the {WATCH_MONTHS} months before ({reference:.0f})"
                )
    return alerts


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
                for table in TABNET_TABLES:
                    fetch_tabnet(year, self._tabnet_page(table, year), table.modalities)

    def clean(self) -> None:
        files = sorted(
            path for path in self._raw_dir.glob("POBR*.dbc")
            if (match := FILE_NAME.match(path.name)) and int(match[1]) >= FIRST_YEAR
        )
        if not files:
            raise FileNotFoundError(f"no POBR*.dbc in {self._raw_dir}: run the download step")
        counts = count_cases(row for path in files for row in _read_dbc(path))
        # DATASUS rewrites every file each month; the newest file date is the extract's.
        written = max(path.stat().st_mtime for path in files)
        extracted_at = datetime.fromtimestamp(written, UTC).date().isoformat()
        write_clean(self._clean_dir, counts.by_municipality, counts.by_month, extracted_at=extracted_at)

    def compute(self) -> None:
        rows = read_clean(self._clean_dir)
        provisional = {row.year for row in rows if row.provisional}
        alerts = monthly_drops(read_months(self._clean_dir), provisional=provisional)
        (self._clean_dir / "monthly_alerts.json").write_text(json.dumps(alerts))
        immediate_region_of = self._immediate_region_of()
        for cancer_type in CANCER_TYPES:
            counts = {
                (row.year, row.municipality): row.counts
                for row in rows
                if row.cancer_type == cancer_type
            }
            layer = within_60_days_layer(counts, immediate_region_of=immediate_region_of, provisional=provisional, cancer_type=cancer_type)
            path = self._clean_dir / "layers" / f"{cancer_type}.json"
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(layer))

    def validate(self) -> None:
        """Compare the cases by UF with TabNet, year by year, over all cases (counts, % within
        60 days and % without information) and over the chemo/radio cases (counts and % within
        60 days, the value), and check the layers: every municipality of the mesh,
        and shares between 0 and 100%.

        A monthly drop in the cases of a first treatment only alerts the maintainer, on
        stderr: it does not block the publication (spec, section 14)."""
        rows = read_clean(self._clean_dir)
        for alert in json.loads((self._clean_dir / "monthly_alerts.json").read_text()):
            print(f"{self.name}: alert: {alert}", file=sys.stderr)
        self._check(rows)

    def _check(self, rows: Sequence[CleanRow]) -> None:
        """The checks that block the publication."""
        by_year: dict[int, dict[str, CaseCounts]] = {}
        for row in rows:
            if row.cancer_type == TABNET_CANCER_TYPE:
                by_uf = by_year.setdefault(row.year, {})
                uf = row.municipality[:2]
                by_uf[uf] = by_uf.get(uf, CaseCounts()) + row.counts

        problems = []
        for table in TABNET_TABLES:
            for year, by_uf in sorted(by_year.items()):
                page = self._tabnet_page(table, year)
                if not page.exists():
                    problems.append(f"{table.label}, {year}: no TabNet table to compare with")
                    continue
                if table.modalities:
                    ours = {uf: UfShare(c.chemo_radio_within_60_days, c.chemo_radio) for uf, c in by_uf.items()}
                else:
                    ours = {
                        uf: UfShare(c.within_60_days, c.cases, c.without_treatment_info) for uf, c in by_uf.items()
                    }
                official = parse_tabnet(page.read_text("latin-1"))
                problems += [
                    f"{table.label}, {problem}" for problem in compare_with_tabnet(ours, official, year=year)
                ]

        expected = self._immediate_region_of().keys()
        for cancer_type in CANCER_TYPES:
            layer = self._layer(cancer_type)
            if layer["municipalities"].keys() != expected:
                problems.append(f"layer '{cancer_type}' does not cover the mesh's municipalities")
            implausible = sorted(
                code
                for code, entry in layer["municipalities"].items()
                for share in (entry["value"], entry["without_treatment_info"])
                if share is not None and not 0 <= share <= 100
            )
            if implausible:
                problems.append(f"layer '{cancer_type}' has shares outside 0–100%: {implausible[:10]}")
            unbanded = sorted(uf for uf, quality in layer["quality"].items() if quality["band"] is None)
            if unbanded:
                problems.append(f"layer '{cancer_type}' has UFs without a quality band: {', '.join(unbanded)}")
        if problems:
            raise PainelValidationError("; ".join(problems))

    def export(self) -> None:
        """Publish the map layers and the manifest, only if the blocking checks pass."""
        self._check(read_clean(self._clean_dir))
        extract = json.loads((self._clean_dir / "extract.json").read_text())
        files: dict[str, object] = {}
        periods = {}
        for cancer_type in CANCER_TYPES:
            layer = self._layer(cancer_type)
            periods[cancer_type] = layer["period"]
            files[f"map/{INDICATOR}/{cancer_type}.json"] = {
                "indicator": INDICATOR,
                "cancer_type": cancer_type,
                "has_status": cancer_type not in WITHOUT_STATUS,
                "source": {**SOURCE, "period": _period_text(layer["period"])},
                **layer,
            }
        files[MANIFEST] = updated_manifest(
            self._site_data_dir,
            source=self.name,
            extract={"name": SOURCE["name"], **extract},
            indicators={INDICATOR: periods},
        )
        publish_together(self._site_data_dir, files)

    def _tabnet_page(self, table: TabnetTable, year: int) -> Path:
        return self._raw_dir / "tabnet" / table.directory / f"{year}.html"

    def _immediate_region_of(self) -> dict[str, str]:
        """Each municipality of the mesh → its immediate region."""
        listing = json.loads((self._site_data_dir / "municipalities.json").read_text())
        return {m["code"]: m["immediate_region"] for m in listing["municipalities"]}

    def _layer(self, cancer_type: str) -> dict[str, Any]:
        layer: dict[str, Any] = json.loads((self._clean_dir / "layers" / f"{cancer_type}.json").read_text())
        return layer


def _period_text(period: Mapping[str, Any]) -> str:
    first, last = period["first_year"], period["last_year"]
    provisional = ", ".join(str(y) for y in period["provisional"])
    trend_first, trend_last = period["trend"]
    quality_first, quality_last = period["quality_years"]
    return (
        f"Anos de diagnóstico {first}–{last} ({provisional} provisórios). "
        f"Tendência {trend_first}–{trend_last} e valor de {period['latest']} medidos nos casos tratados "
        "com quimioterapia ou radioterapia; "
        f"% sem informação de {period['latest']} sobre todos os casos diagnosticados; "
        f"faixa de qualidade {quality_first}–{quality_last}, por UF, sobre todos os casos diagnosticados"
    )


def _read_dbc(path: Path) -> Iterator[dict[str, str]]:
    """The fields the Painel source uses, row by row, from a DATASUS DBC file."""
    with tempfile.TemporaryDirectory() as workdir:
        dbf = Path(workdir) / (path.stem + ".dbf")
        datasus_dbc.decompress(str(path), str(dbf))
        for row in dbfread.DBF(str(dbf), encoding="latin-1", char_decode_errors="replace"):
            yield {field: row[field] or "" for field in FIELDS}
