"""Calculate official coverage and choose one origin for map and profile."""

from collections.abc import Mapping, Sequence
from datetime import date
from typing import Any

from pipeline.calculation.cascade import Origin, data_origins
from pipeline.calculation.status import classify_status, status_note
from pipeline.sources.hpv.models import CensusRow, HpvResult


def calculate(official_cohorts: dict[str, Any], census_rows: Sequence[CensusRow],
              immediate_region_of: Mapping[str, str]) -> HpvResult:
    """Use the extraction date and fixed Census, independently of paths and clock."""
    regions = immediate_region_of
    census = census_rows
    try:
        extracted = date.fromisoformat(official_cohorts['extracted_at'])
    except (KeyError, TypeError, ValueError) as error:
        raise ValueError('official HPV cohorts require a valid extraction date for temporal context') from error
    years = official_cohorts.get('years')
    if (not isinstance(years, list) or not years
            or any(type(year) is not int for year in years)
            or years[-1] > extracted.year
            or years != list(range(2020, years[-1] + 1))):
        raise ValueError('official HPV cohorts require complete years starting in 2020')
    if not official_cohorts.get('source_url'):
        raise ValueError('official HPV cohorts require complete years and provenance')
    populations: dict[str, dict[str, int]] = {code: {'F': 0, 'M': 0} for code in regions}
    seen: set[tuple[str, str, int]] = set()
    for code, census_sex, age, population in census:
        if code not in regions or census_sex not in ('F', 'M') or age not in range(9, 15):
            continue
        slice_key = (code, census_sex, age)
        if slice_key in seen or population is None or population < 0:
            raise ValueError('duplicate or invalid Census 2022 population')
        seen.add(slice_key)
        populations[code][census_sex] += int(population)
    missing = {(code, sex, age) for code in regions for sex in ('F', 'M') for age in range(9, 15)} - seen
    absent = set(regions) - {item[0] for item in seen}
    if absent - {'510183'}:
        raise ValueError('unexpected municipality missing from Census 2022')
    if missing - {(code, sex, age) for code in absent for sex in ('F', 'M') for age in range(9, 15)}:
        raise ValueError('Census 2022 does not cover all municipality/sex/age slices; never use POPSVS as fallback')
    counts = {}
    for row in official_cohorts['records']:
        code, year = row['municipality'], row['year']
        if type(year) is not int or year not in years:
            raise ValueError('official HPV record year is outside the declared history')
        if code not in regions:
            continue
        sex = {'Feminino': 'F', 'Masculino': 'M'}.get(row['sex'])
        if sex is None:
            raise ValueError('unknown sex in official HPV cohorts')
        key_tuple = (code, sex, year)
        vaccinated, population = row['vaccinated'], row['population']
        if (key_tuple in counts or not isinstance(vaccinated, (int, float))
                or not 0 <= vaccinated < float('inf') or vaccinated != int(vaccinated)
                or population != populations[code][sex]):
            raise ValueError('invalid or duplicate official HPV cohort or Census denominator mismatch')
        if population and abs(row['coverage'] - vaccinated / population) > 0.000001:
            raise ValueError('official HPV coverage disagrees with numerator and denominator')
        counts[key_tuple] = int(vaccinated)
    expected = {(code, sex, year) for code in regions if code not in absent
                for sex in ('F', 'M') for year in years}
    if expected - counts.keys():
        raise ValueError('missing municipality, sex or year in official HPV cohorts')
    # A denominator, rather than dose volume, chooses the origin for the whole card.
    origins = data_origins({code: sum(populations[code].values()) for code in regions}, regions, years=1)
    members: dict[str, list[str]] = {f'municipality:{code}': [code] for code in regions}
    for code, region in regions.items():
        members.setdefault(f'immediate_region:{region}', []).append(code)
    provisional = [year for year in years if year >= extracted.year]
    consolidated = [year for year in years if year not in provisional]
    if not consolidated:
        raise ValueError('HPV requires a complete consolidated year')
    latest = max(consolidated)
    displayed: dict[str, list[dict[str, Any]]] = {}
    entries = {}
    for code, origin in origins.items():
        key = (f'municipality:{code}' if origin is Origin.MUNICIPALITY else
               f'immediate_region:{regions[code]}' if origin is Origin.IMMEDIATE_REGION else None)
        if key and key not in displayed:
            points = []
            for year in years:
                by_sex = {}
                numerator = denominator = 0
                for sex in ('F', 'M'):
                    n = sum(counts.get((member, sex, year), 0) for member in members[key])
                    d = sum(populations[member][sex] for member in members[key])
                    numerator += n
                    denominator += d
                    by_sex[sex] = coverage_result(n, d)
                points.append({'year': year, **coverage_result(numerator, denominator),
                               'by_sex': by_sex, 'single_dose': year == 2024,
                               'provisional': year in provisional, 'without_treatment_info': None})
            displayed[key] = points
        point = next(p for p in displayed[key] if p['year'] == latest) if key else None
        result = {field: point[field] for field in ('value', 'status', 'status_note', 'by_sex')} if point else {
            **coverage_result(0, 0), 'by_sex': {sex: coverage_result(0, 0) for sex in ('F', 'M')}}
        entries[code] = {'origin': origin.value, **result, 'trend': None,
                         'denominator_note': ('Município criado após o Censo 2022; usamos a população do seu município e vizinhos.' if code in absent else None),
                         'quality_band': None, 'without_treatment_info': None, 'series_id': key}
    period = {'first_year': 2020, 'last_year': max(years), 'latest': latest,
              'trend': [], 'provisional': provisional, 'single_dose_year': 2024,
              'denominator_year': 2022}
    return HpvResult(period, {'value': 90, 'label': 'meta para 2030'}, entries, displayed)


def coverage_result(numerator: int, denominator: int) -> dict[str, Any]:
    value = 100 * numerator / denominator if denominator else None
    return {'value': value, 'status': classify_status(value, reference=90),
            'status_note': status_note(value, maximum=100)}
