"""Assemble public map and profile documents without statistical decisions."""

from collections.abc import Mapping
from typing import Any

from .acquisition import FTP_DIR
from .models import CANCER_TYPES, WITHOUT_STATUS
from .calculation import PainelResult

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


def documents(
    result: PainelResult, listing: Mapping[str, Any], existing_profiles: Mapping[str, Any],
) -> tuple[dict[str, object], dict[str, Any]]:
    """Assemble map/profile documents and manifest periods from one calculated result."""
    files: dict[str, object] = {}
    periods = {}
    for cancer_type in CANCER_TYPES:
        layer = result.layers[cancer_type]
        periods[cancer_type] = layer["period"]
        files[f"map/{INDICATOR}/{cancer_type}.json"] = {
            "indicator": INDICATOR,
            "cancer_type": cancer_type,
            "has_status": cancer_type not in WITHOUT_STATUS,
            "source": {**SOURCE, "period": _period_text(layer["period"])},
            **layer,
        }
    profiles_by_type = result.profiles
    for uf in sorted({m["uf"] for m in listing["municipalities"]}):
        name = f"profiles/{uf}.json"
        profile = existing_profiles.get(uf, {"uf": uf, "indicators": {}})
        profile = {**profile, "indicators": {**profile["indicators"]}}
        types = {}
        codes = {m["code"] for m in listing["municipalities"] if m["uf"] == uf}
        uf_code = next(iter(codes))[:2]
        for cancer_type, computed in profiles_by_type.items():
            layer = result.layers[cancer_type]
            municipalities = {code: computed["municipalities"][code] for code in sorted(codes)}
            series_ids = {entry["series_id"] for entry in municipalities.values()} - {None}
            types[cancer_type] = {
                "period": layer["period"], "source": {**SOURCE, "period": _period_text(layer["period"])},
                "has_status": cancer_type not in WITHOUT_STATUS, "reference": layer["reference"],
                "quality": layer["quality"][uf_code], "uf_trend": computed["uf_trends"][uf_code],
                "municipalities": municipalities,
                "series": {key: computed["series"][key] for key in sorted(series_ids)},
            }
        profile["indicators"][INDICATOR] = types
        files[name] = profile
    return files, periods


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
