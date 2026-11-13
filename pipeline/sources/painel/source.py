"""Coordinate the five Source stages, filesystem inputs and joint publication."""

import json
import shutil
import sys
from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path

from pipeline.paths import CLEAN_DIR, RAW_DIR, SITE_DATA_DIR
from pipeline.publish import MANIFEST, publish_together, updated_manifest
from .acquisition import FILE_NAME, FIRST_YEAR, download, parse_tabnet, read_dbc, count_cases
from .models import TABNET_TABLES, TABNET_CANCER_TYPE, TabnetTable, CleanRow
from .calculation import calculate
from .persistence import read_clean, read_months, read_layers, read_result, write_clean, write_result
from .validation import check
from .export import SOURCE, INDICATOR, documents


class PainelSource:
    """% of cases treated within 60 days, and % without treatment information."""

    name = "painel"

    def __init__(
        self,
        *,
        raw_dir: Path = RAW_DIR / "painel",
        clean_dir: Path = CLEAN_DIR / "painel",
        site_data_dir: Path = SITE_DATA_DIR,
    ) -> None:
        self._raw_dir = raw_dir
        self._clean_dir = clean_dir
        self._site_data_dir = site_data_dir

    def download(self) -> None:
        download(self._raw_dir)

    def clean(self) -> None:
        files = sorted(
            path for path in self._raw_dir.glob("POBR*.dbc")
            if (match := FILE_NAME.match(path.name)) and int(match[1]) >= FIRST_YEAR
        )
        if not files:
            raise FileNotFoundError(f"no POBR*.dbc in {self._raw_dir}: run the download step")
        counts = count_cases(row for path in files for row in read_dbc(path))
        # DATASUS rewrites every file each month; the newest file date is the extract's.
        written = max(path.stat().st_mtime for path in files)
        extracted_at = datetime.fromtimestamp(written, UTC).date().isoformat()
        # Preserve only the official comparisons for the observed diagnosis years.
        # Later validation must not depend on a mutable cache on the original machine.
        pages = {
            Path(table.directory) / f"{year}.html": self._tabnet_page(table, year).read_bytes()
            for year in sorted({year for year, _, _ in counts.by_municipality})
            for table in TABNET_TABLES
        }
        for page in pages.values():
            parse_tabnet(page.decode("latin-1"))
        write_clean(self._clean_dir, counts.by_municipality, counts.by_month, extracted_at=extracted_at)
        references = self._clean_dir / "tabnet"
        if references.exists():
            shutil.rmtree(references)
        for name, page in pages.items():
            destination = references / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(page)

    def compute(self) -> None:
        result = calculate(
            read_clean(self._clean_dir), read_months(self._clean_dir), self._immediate_region_of(),
        )
        write_result(self._clean_dir, result)

    def validate(self) -> None:
        """Compare the cases by UF with TabNet, year by year, over all cases (counts, % within
        60 days and % without information) and over the chemo/radio cases (counts and % within
        60 days, the value), and check the layers: every municipality of the mesh,
        and shares between 0 and 100%.

        A monthly drop in the cases of a first treatment only alerts the maintainer, on
        stderr: it does not block the publication (spec, section 14)."""
        rows = read_clean(self._clean_dir)
        for alert in json.loads((self._clean_dir / "monthly_alerts.json").read_text()):
            print(f"{self.name}: alert: {alert}", file=sys.stderr)
        self._check(rows)

    def _check(self, rows: Sequence[CleanRow]) -> None:
        """The checks that block the publication."""
        tables = {}
        for table in TABNET_TABLES:
            for year in sorted({row.year for row in rows if row.cancer_type == TABNET_CANCER_TYPE}):
                page = self._clean_dir / "tabnet" / table.directory / f"{year}.html"
                if page.exists():
                    tables[(table.directory, year)] = parse_tabnet(page.read_text("latin-1"))
        check(rows, read_layers(self._clean_dir), tables, self._immediate_region_of().keys())

    def export(self) -> None:
        """Publish the map layers and the manifest, only if the blocking checks pass."""
        self._check(read_clean(self._clean_dir))
        extract = json.loads((self._clean_dir / "extract.json").read_text())
        listing = json.loads((self._site_data_dir / "municipalities.json").read_text())
        existing = {}
        for uf in sorted({m["uf"] for m in listing["municipalities"]}):
            path = self._site_data_dir / "profiles" / f"{uf}.json"
            if path.exists():
                existing[uf] = json.loads(path.read_text())
        files, periods = documents(read_result(self._clean_dir), listing, existing)
        files[MANIFEST] = updated_manifest(
            self._site_data_dir,
            source=self.name,
            extract={"name": SOURCE["name"], **extract},
            indicators={INDICATOR: periods},
        )
        publish_together(self._site_data_dir, files)

    def _tabnet_page(self, table: TabnetTable, year: int) -> Path:
        return self._raw_dir / "tabnet" / table.directory / f"{year}.html"

    def _immediate_region_of(self) -> dict[str, str]:
        """Each municipality of the mesh → its immediate region."""
        listing = json.loads((self._site_data_dir / "municipalities.json").read_text())
        return {m["code"]: m["immediate_region"] for m in listing["municipalities"]}
