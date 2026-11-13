"""Official HPV coverage result and Census records."""

from dataclasses import dataclass
from typing import Any, NamedTuple

SOURCE = {'name': 'Coortes vacinais HPV — Ministério da Saúde (SI-PNI/RNDS e TabNet)',
          'url': 'https://www.gov.br/saude/pt-br/vacinacao/paineis-de-vacinacao/hpv',
          'conditions': 'Dados abertos; reutilização com citação da fonte.',
          'period': 'Coorte de 9–14 anos; ao menos uma dose de HPV quadrivalente ou nonavalente.'}


class CensusRow(NamedTuple):
    municipality: str
    sex: str
    age: int
    population: int | None


@dataclass
class HpvResult:
    period: dict[str, Any]
    reference: dict[str, Any]
    municipalities: dict[str, dict[str, Any]]
    series: dict[str, list[dict[str, Any]]]
