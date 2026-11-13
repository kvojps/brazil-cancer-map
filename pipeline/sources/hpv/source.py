"""Coordinate official HPV acquisition, calculation, validation and publication."""

import json
from datetime import UTC, datetime
from pathlib import Path

from pipeline.download import HttpTransport, Transport, with_retries
from pipeline.hpv_inputs import download_fixed_inputs
from pipeline.hpv_official import download_official_cohorts
from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from pipeline.sources.hpv.calculation import calculate
from pipeline.sources.hpv.export import documents
from pipeline.sources.hpv.models import HpvResult, SOURCE
from pipeline.sources.hpv.persistence import read_census, read_official, read_result, write_result
from pipeline.sources.hpv.validation import check


class HpvSource:
    name = 'hpv'

    def __init__(self, *, raw_dir: Path = RAW_DIR / 'hpv',
                 clean_dir: Path = CLEAN_DIR / 'hpv', site_data_dir: Path = SITE_DATA_DIR,
                 years: tuple[int, ...] | None = None,
                 validation_path: Path = Path(__file__).resolve().parents[2] / 'references' / 'hpv.json',
                 transport: Transport | None = None) -> None:
        if years is None:
            years = tuple(range(2020, datetime.now(UTC).year + 1))
        if (not years or len(set(years)) != len(years)
                or any(year < 2020 or year > datetime.now(UTC).year for year in years)):
            raise ValueError('HPV years must be distinct years from 2020 through the current year')
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir
        self._site_data_dir = site_data_dir
        self._years = years
        self._transport = transport or HttpTransport()
        self._validation_path = validation_path

    def download(self) -> None:
        """Refresh official cohorts and the fixed Census without patient extracts."""
        download_fixed_inputs(self._raw_dir, self._clean_dir, include_legacy=False)
        self.download_official()

    def download_official(self) -> None:
        """Refresh the qualified national cohorts published by the Ministry."""
        with_retries(lambda: download_official_cohorts(self._clean_dir / 'official.json', tuple(range(2020, datetime.now(UTC).year + 1))),
                     'download official HPV cohorts')

    def clean(self) -> None:
        """Official cohorts and Census are standardized during download."""

    def compute(self) -> None:
        result = calculate(read_official(self._clean_dir), read_census(self._clean_dir),
                           self._immediate_region_of())
        write_result(self._clean_dir, result)

    def _immediate_region_of(self) -> dict[str, str]:
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        return {m['code']: m['immediate_region'] for m in listing['municipalities']}

    def _check(self, result: HpvResult) -> None:
        if not self._validation_path.exists():
            raise ValueError('official HPV coverage references are required before publication')
        reference = json.loads(self._validation_path.read_text())
        check(result, self._immediate_region_of().keys(), reference)

    def validate(self) -> None:
        self._check(read_result(self._clean_dir))

    def export(self) -> None:
        """Revalidate and publish derived coverage together, preserving other indicators."""
        result = read_result(self._clean_dir)
        self._check(result)
        listing = json.loads((self._site_data_dir / 'municipalities.json').read_text())
        existing = {}
        for uf in {m['uf'] for m in listing['municipalities']}:
            path = self._site_data_dir / 'profiles' / f'{uf}.json'
            if path.exists():
                existing[uf] = json.loads(path.read_text())
        files = documents(result, listing, existing)
        official = read_official(self._clean_dir)
        files[MANIFEST] = updated_manifest(self._site_data_dir, source=self.name,
            extract={'name': SOURCE['name'], 'extracted_at': official['extracted_at'],
                     'files': ['official.json', 'census.parquet']},
            indicators={'hpv': {cancer_type: result.period for cancer_type in ('all', 'cervix')}})
        publish_together(self._site_data_dir, files)
