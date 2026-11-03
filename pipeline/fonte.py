"""O que o pipeline espera de cada fonte de dados."""

from collections.abc import Callable
from typing import Protocol


class Fonte(Protocol):
    """Uma fonte de dados (por exemplo a malha IBGE ou o SIM), com um método por etapa.

    Uma etapa sinaliza falha levantando uma exceção. Numa mesma execução, as
    etapas seguintes daquela fonte não rodam: se a validação falha, nada da
    fonte é exportado.
    """

    nome: str

    def baixar(self) -> None:
        """Baixa o dado bruto para `data/raw/`, com cache incremental."""

    def limpar(self) -> None:
        """Gera o Parquet padronizado em `data/clean/`."""

    def calcular(self) -> None:
        """Calcula os indicadores. É o único lugar com estatística."""

    def validar(self) -> None:
        """Confere contra os números oficiais; levanta exceção se falhar."""

    def exportar(self) -> None:
        """Gera o contrato de dados em `site/public/dados/`."""


ETAPAS: dict[str, Callable[[Fonte], None]] = {
    "baixar": lambda fonte: fonte.baixar(),
    "limpar": lambda fonte: fonte.limpar(),
    "calcular": lambda fonte: fonte.calcular(),
    "validar": lambda fonte: fonte.validar(),
    "exportar": lambda fonte: fonte.exportar(),
}
"""As etapas do pipeline, na ordem em que rodam (spec, seção 14)."""
