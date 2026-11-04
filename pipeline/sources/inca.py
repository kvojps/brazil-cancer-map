"""Publish the manually transcribed INCA edition as state/capital context."""

import json
from datetime import date
from pathlib import Path
from typing import Any

from pipeline.paths import SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest

INPUT = Path(__file__).resolve().parents[1] / 'references' / 'inca-estimates-2026.json'
CANCER_TYPES = {'all', 'breast', 'cervix', 'prostate', 'colorectal', 'lung'}
CAPITALS = dict(zip(
    'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(),
    ('Rio Branco', 'Maceió', 'Macapá', 'Manaus', 'Salvador', 'Fortaleza', 'Brasília',
     'Vitória', 'Goiânia', 'São Luís', 'Cuiabá', 'Campo Grande', 'Belo Horizonte',
     'Belém', 'João Pessoa', 'Curitiba', 'Recife', 'Teresina', 'Rio de Janeiro',
     'Natal', 'Porto Alegre', 'Porto Velho', 'Boa Vista', 'Florianópolis', 'São Paulo',
     'Aracaju', 'Palmas'), strict=True))


class IncaSource:
    name = 'inca'

    def __init__(self, *, input_path: Path = INPUT, site_data_dir: Path = SITE_DATA_DIR) -> None:
        self._input_path = input_path
        self._site_data_dir = site_data_dir

    def download(self) -> None:
        """The edition is a versioned manual input, never refreshed automatically."""
        self.validate()

    def clean(self) -> None:
        """The input already contains standardized counts."""
        self.validate()

    def compute(self) -> None:
        """No statistics: these are the INCA counts, without a municipal estimate."""
        self.validate()

    def validate(self) -> None:
        data = self._read()
        if data.get('edition') != '2026–2028' or data.get('annual_year') != 2026:
            raise ValueError('expected the 2026–2028 INCA edition and annual counts')
        date.fromisoformat(data['extracted_at'])
        if (not data.get('extraction_note') or not all(data.get('source', {}).get(key)
                for key in ('name', 'url', 'conditions'))):
            raise ValueError('INCA input requires provenance and extraction notes')
        states = data.get('states', {})
        if set(states) != set(CAPITALS):
            raise ValueError('INCA input must cover all 27 UFs')
        for uf, entry in states.items():
            if entry.get('capital_name') != CAPITALS[uf]:
                raise ValueError(f'INCA capital mismatch for {uf}')
            for geography in ('state', 'capital'):
                counts = entry.get(geography, {})
                if set(counts) != CANCER_TYPES:
                    raise ValueError(f'INCA requires all six cancer types for {uf}/{geography}')
                if any(type(value) is not int or value < 0 or value % 10 for value in counts.values()):
                    raise ValueError('INCA counts must be nonnegative integers rounded to tens')
                if any(value > counts['all'] for value in counts.values()):
                    raise ValueError('INCA type count exceeds all cancers')
            if any(entry['capital'][kind] > entry['state'][kind] for kind in CANCER_TYPES):
                raise ValueError('INCA capital count exceeds state count')
        if states['DF']['state'] != states['DF']['capital']:
            raise ValueError('Brasília must use the published Distrito Federal counts')

    def export(self) -> None:
        self.validate()
        data = self._read()
        files: dict[str, object] = {}
        for uf, entry in data['states'].items():
            path = self._site_data_dir / 'profiles' / f'{uf}.json'
            profile = json.loads(path.read_text()) if path.exists() else {'uf': uf, 'indicators': {}}
            profile['indicators']['estimated_cases'] = {
                kind: {key: data[key] for key in ('edition', 'annual_year', 'extracted_at', 'source')} | {
                    'state_cases': entry['state'][kind], 'capital_cases': entry['capital'][kind],
                    'capital_name': entry['capital_name'], 'capital_is_df': uf == 'DF',
                } for kind in sorted(CANCER_TYPES)}
            files[f'profiles/{uf}.json'] = profile
        files[MANIFEST] = updated_manifest(self._site_data_dir, source=self.name,
            extract={key: data[key] for key in ('extracted_at', 'source', 'extraction_note')},
            indicators={'estimated_cases': {kind: {'edition': data['edition'], 'annual_year': data['annual_year']}
                                           for kind in sorted(CANCER_TYPES)}})
        publish_together(self._site_data_dir, files)

    def _read(self) -> dict[str, Any]:
        data: dict[str, Any] = json.loads(self._input_path.read_text())
        return data
