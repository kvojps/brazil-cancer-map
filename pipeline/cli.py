"""Linha de comando do pipeline: `python -m pipeline run`."""

import argparse
import sys
from collections.abc import Sequence

from pipeline.fonte import ETAPAS, Fonte

ORDEM_DAS_ETAPAS = " → ".join(ETAPAS)


def main(argv: Sequence[str], fontes: Sequence[Fonte]) -> int:
    """Roda as etapas do pipeline nas fontes dadas e devolve o código de saída."""
    parser = argparse.ArgumentParser(prog="python -m pipeline")
    sub = parser.add_subparsers(dest="comando", required=True)
    run = sub.add_parser(
        "run",
        help="roda o pipeline",
        description=f"Etapas, em ordem: {ORDEM_DAS_ETAPAS}.",
    )
    run.add_argument("--fonte", help="roda só esta fonte")
    run.add_argument("--etapa", choices=list(ETAPAS), help="roda só esta etapa")
    run.add_argument("--listar", action="store_true", help="mostra etapas e fontes sem executar")
    args = parser.parse_args(argv)

    nomes = [f.nome for f in fontes]

    if args.listar:
        print(f"Etapas: {ORDEM_DAS_ETAPAS}")
        print("Fontes: " + (", ".join(nomes) or "nenhuma registrada"))
        return 0

    if args.fonte is not None:
        if args.fonte not in nomes:
            parser.error(
                f"fonte desconhecida: {args.fonte!r} (disponíveis: {', '.join(nomes) or 'nenhuma'})"
            )
        fontes = [f for f in fontes if f.nome == args.fonte]

    etapas = list(ETAPAS) if args.etapa is None else [args.etapa]

    houve_falha = False
    for fonte in fontes:
        for etapa in etapas:
            print(f"{fonte.nome}: {etapa}")
            try:
                ETAPAS[etapa](fonte)
            except Exception as erro:
                # Se uma etapa falha, nada daquela fonte segue adiante (spec, seção 14).
                print(f"{fonte.nome}: {etapa} falhou: {erro}", file=sys.stderr)
                houve_falha = True
                break
    return 1 if houve_falha else 0
