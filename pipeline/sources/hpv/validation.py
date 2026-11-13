"""Blocking coverage and official-reference checks on loaded data."""

from collections.abc import Iterable
from dataclasses import asdict
from typing import Any

from pipeline.calculation.status import classify_status
from pipeline.sources.hpv.models import HpvResult


def check(result: HpvResult, municipality_codes: Iterable[str], reference: dict[str, Any]) -> None:
    data = asdict(result)
    if set(data['municipalities']) != set(municipality_codes):
        raise ValueError('HPV does not cover the mesh municipalities')
    for entry in list(data['municipalities'].values()) + [p for points in data['series'].values() for p in points]:
        for coverage in [entry, *entry['by_sex'].values()]:
            value = coverage['value']
            if value is not None and (not isinstance(value, (int, float)) or not 0 <= value < float('inf')):
                raise ValueError('HPV coverage outside plausible nonnegative finite range')
            if coverage['status'] != classify_status(value, reference=90):
                raise ValueError('HPV status inconsistent with coverage')

    if not reference.get('source_url') or not reference.get('extracted_at') or not reference.get('observations'):
        raise ValueError('official HPV coverage references require provenance and observations')
    tolerance = reference.get('tolerance_pp')
    if not isinstance(tolerance, (int, float)) or not 0 <= tolerance <= 1:
        raise ValueError('official HPV coverage comparison requires tolerance between 0 and 1 percentage point')
    sexes_checked = set()
    for observation in reference['observations']:
        code, year, sex = observation['municipality'], observation['year'], observation.get('sex')
        entry = data['municipalities'].get(code)
        if entry is None or entry['origin'] != 'municipality':
            raise ValueError('official HPV sample requires an eligible municipality, without regional substitution')
        point = next((point for point in data['series'][entry['series_id']] if point['year'] == year), None)
        if point is None or point['provisional'] or sex not in (None, 'F', 'M'):
            raise ValueError('official HPV sample has an unavailable year or sex')
        actual = point['value'] if sex is None else point['by_sex'][sex]['value']
        expected = observation['value']
        if (not isinstance(expected, (int, float)) or not 0 <= expected < float('inf')
                or actual is None or abs(actual - expected) > tolerance):
            raise ValueError(f'HPV coverage differs from official reference for {code}/{year}/{sex}')
        sexes_checked.add(sex)
    if not {None, 'F', 'M'} <= sexes_checked:
        raise ValueError('official HPV references must check the total and both sexes')
