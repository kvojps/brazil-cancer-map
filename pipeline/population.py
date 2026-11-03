"""Population denominators shared by indicator compute steps."""

from dataclasses import dataclass
from pathlib import Path

import duckdb

from pipeline.paths import CLEAN_DIR


@dataclass(frozen=True)
class PopulationResult:
    population: int
    year: int
    provisional: bool


class Population:
    """Query inclusive ages; age 80 represents everyone aged 80 or older."""

    def __init__(self, path: Path = CLEAN_DIR / 'popsvs' / 'population.parquet') -> None:
        self._path = path

    def get(self, municipality: str, year: int, *, sex: int | None = None,
            min_age: int = 0, max_age: int = 80) -> PopulationResult:
        if len(municipality) != 6 or not municipality.isdigit():
            raise ValueError('municipality must have six digits')
        if sex not in (None, 1, 2) or not 0 <= min_age <= max_age <= 80:
            raise ValueError('invalid sex or age range')
        with duckdb.connect() as db:
            years = {row[0] for row in db.execute('SELECT DISTINCT year FROM read_parquet(?)', [str(self._path)]).fetchall()}
            selected = year if year in years else year - 1
            if selected not in years:
                raise ValueError(f'no population file for {year} or the previous year')
            result = db.execute('''SELECT sum(population) FROM read_parquet(?)
                WHERE municipality = ? AND year = ? AND (? IS NULL OR sex = ?)
                AND age BETWEEN ? AND ?''',
                [str(self._path), municipality, selected, sex, sex, min_age, max_age]).fetchone()
        if result is None or result[0] is None:
            raise ValueError(f'no population for municipality {municipality} in {selected}')
        return PopulationResult(int(result[0]), selected, selected != year)
