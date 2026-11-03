"""Q2: recompute the municipal trend classes of '60 dias x Todos' under each alternative.

Usage (from the repo root, so `pipeline` imports): uv run python -I effect_on_classes.py <painel.parquet> <municipalities.json>
Uses pipeline.trend.quasi_poisson_trend, the same fit as the published map, municipality only (no cascade).
"""
import collections
import json
import os
import sys

sys.path.insert(0, os.getcwd())
sys.path.insert(0, os.path.dirname(__file__))
from common import connect  # noqa: E402
from pipeline.trend import quasi_poisson_trend  # noqa: E402

db = connect(sys.argv[1])
mesh = [m["code"] for m in json.load(open(sys.argv[2]))["municipalities"]]
# Per (municipality, year): (cases, within 60, treated, chemo/radio cases, chemo/radio within 60).
rows = db.sql("""SELECT mun, ano, count(*) n, sum(ok60::INT) ok, sum((NOT seminfo)::INT) tr,
  count(*) FILTER (trat IN ('2','3','4')) qr, count(*) FILTER (trat IN ('2','3','4') AND ok60) qr_ok
  FROM c WHERE tipo='todos' AND ano BETWEEN 2014 AND 2024 GROUP BY ALL""").fetchall()
ZERO = (0, 0, 0, 0, 0)
series = collections.defaultdict(dict)
for mun, year, *vals in rows:
    series[mun][year] = tuple(vals)
national = collections.defaultdict(lambda: [0] * 5)
uf = collections.defaultdict(lambda: collections.defaultdict(lambda: [0] * 5))
for mun, by_year in series.items():
    for year, vals in by_year.items():
        for i, v in enumerate(vals):
            national[year][i] += v
            uf[mun[:2]][year][i] += v

ALTERNATIVES = {
    "A 2015-2024, todos os casos (atual)": (range(2015, 2025), 0),
    "B 2019-2024, todos os casos": (range(2019, 2025), 0),
    "C 2015-2024, casos tratados": (range(2015, 2025), 2),
    "D 2019-2024, casos tratados": (range(2019, 2025), 2),
    "E 2019-2023, todos os casos": (range(2019, 2024), 0),
    "F 2019-2023, casos tratados": (range(2019, 2024), 2),
    "G 2015-2024, so quimio/radio (APAC)": (range(2015, 2025), 3),
}
NUMERATOR = {0: 1, 2: 1, 3: 4}


def fit(by_year, years, denom):
    years = list(years)
    return quasi_poisson_trend(
        years, [by_year.get(y, ZERO)[NUMERATOR[denom]] for y in years],
        [by_year.get(y, ZERO)[denom] for y in years], higher_is_better=True)


print(f"{'alternativa':40} {'piorando':>9} {'melhorando':>10} {'estavel':>8} {'sem dir.':>9} {'nao calc.':>9} {'>=20/ano':>9} | Brasil APC [IC]")
for name, (years, denom) in ALTERNATIVES.items():
    classes = collections.Counter()
    passing = 0
    for code in mesh:
        by_year = series.get(code, {})
        t = fit(by_year, years, denom)
        classes[t.trend_class.value if t else "none"] += 1
        passing += sum(by_year.get(y, ZERO)[denom] for y in years) / len(years) >= 20
    br = fit(national, years, denom)
    print(f"{name:40} {classes['worsening']:9} {classes['improving']:10} {classes['stable']:8} "
          f"{classes['no_clear_direction']:9} {classes['none']:9} {passing:9} | "
          f"{br.annual_percent_change:+.1f}% [{br.ci_low:+.1f}; {br.ci_high:+.1f}] {br.trend_class.value}")

print("\nUF classes per alternative")
print("UF  " + "  ".join(n[0] for n in ALTERNATIVES))
for u in sorted(uf):
    cells = []
    for _, (years, denom) in ALTERNATIVES.items():
        t = fit(uf[u], years, denom)
        cells.append({"worsening": "P", "improving": "M", "stable": "E", "no_clear_direction": "?"}[t.trend_class.value]
                     + f"{t.annual_percent_change:+.0f}")
    print(u, "  ".join(f"{c:>4}" for c in cells))

# Transition A -> B, among municipalities classified "piorando" in A
trans = collections.Counter()
for code in mesh:
    by_year = series.get(code, {})
    a, b = fit(by_year, range(2015, 2025), 0), fit(by_year, range(2019, 2025), 0)
    if a and a.trend_class.value == "worsening":
        trans[b.trend_class.value if b else "none"] += 1
print("\nMunicipios 'piorando' em A, classe em B:", dict(trans))
