"""Painel count records, cancer types and comparison tables."""

from collections.abc import Callable, Iterable
from dataclasses import astuple, dataclass
from enum import StrEnum
from typing import NamedTuple

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

CountKey = tuple[int, str, str]
"""(diagnosis year, municipality of residence, cancer type)."""


class FirstTreatment(StrEnum):
    """How the case was first treated, as the monthly watch groups `TRATAMENTO`."""

    SURGERY = "surgery"
    CHEMO_RADIO = "chemo_radio"
    WITHOUT_INFO = "without_treatment_info"


SURGERY = "1"
"""`TRATAMENTO` code for a first treatment by surgery."""

MonthKey = tuple[str, FirstTreatment]
"""(diagnosis month as "YYYY-MM", first treatment)."""


@dataclass
class PainelCounts:
    by_municipality: dict[CountKey, CaseCounts]
    by_month: dict[MonthKey, int]
    """National 'Todos' cases by diagnosis month and first treatment, to watch for registry breaks."""

MEASURED_CASES = "chemo_radio"
"""The cases the trend and the value are measured on, stated in the layer's period."""

PROVISIONAL_YEARS = 2
"""The latest diagnosis years are still filling in treatment records (spec, section 6.4)."""


def provisional_years(years: Iterable[int]) -> set[int]:
    """The 2 latest diagnosis years in the data, which stay provisional."""
    return set(sorted(set(years))[-PROVISIONAL_YEARS:])


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


@dataclass(frozen=True)
class UfShare:
    """Cases, those treated within 60 days and those without treatment information, in one UF:
    TabNet's or ours."""

    within_60_days: int
    cases: int
    without_treatment_info: int = 0


class TabnetTable(NamedTuple):
    """One TabNet comparison: case filters and relative directory in the snapshot."""

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

TABNET_CANCER_TYPE = "all"
"""The TabNet query reproduces 'Todos' for treatment, so it checks that cancer type."""

