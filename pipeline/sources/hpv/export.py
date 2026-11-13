"""Assemble map and profile documents without recalculating coverage or origin."""

from copy import deepcopy
from dataclasses import asdict
from typing import Any

from pipeline.sources.hpv.models import HpvResult, SOURCE


def documents(result: HpvResult, listing: dict[str, Any],
              existing_profiles: dict[str, dict[str, Any]]) -> dict[str, object]:
    data = asdict(result)
    files: dict[str, object] = {}
    common = {'period': data['period'], 'reference': data['reference'],
              'source': SOURCE, 'has_status': True, 'has_trend': False}
    for cancer_type in ('all', 'cervix'):
        files[f'map/hpv/{cancer_type}.json'] = {
            **common, 'indicator': 'hpv', 'cancer_type': cancer_type,
            'municipalities': {code: {k: v for k, v in entry.items() if k != 'series_id'}
                               for code, entry in data['municipalities'].items()}}
    for uf in {m['uf'] for m in listing['municipalities']}:
        name = f'profiles/{uf}.json'
        profile = deepcopy(existing_profiles[uf]) if uf in existing_profiles else {'uf': uf, 'indicators': {}}
        codes = {m['code'] for m in listing['municipalities'] if m['uf'] == uf}
        entries = {code: data['municipalities'][code] for code in sorted(codes)}
        keys = {entry['series_id'] for entry in entries.values()} - {None}
        published = {**common, 'municipalities': entries, 'uf_trend': None,
                     'series': {key: data['series'][key] for key in sorted(keys)}}
        profile['indicators']['hpv'] = {cancer_type: published for cancer_type in ('all', 'cervix')}
        files[name] = profile
    return files
