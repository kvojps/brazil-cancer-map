"""Population denominators shared by indicator compute steps."""

from dataclasses import dataclass
from collections.abc import Collection
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
        results = self.get_many([municipality], [year], sex=sex, min_age=min_age, max_age=max_age)
        result = results.get((municipality, year))
        if result is None:
            raise ValueError(f'no population for municipality {municipality} in {year}')
        return result

    def get_many(self, municipalities: Collection[str], years: Collection[int], *,
                 sex: int | None = None, min_age: int = 0,
                 max_age: int = 80) -> dict[tuple[str, int], PopulationResult]:
        """Batch the same queries as get, omitting years before a municipality's first record.

        Keys use the requested year; each result records the population year used.
        An incomplete age/sex slice never makes a whole year eligible for fallback.
        """
        if any(len(code) != 6 or not code.isdigit() for code in municipalities):
            raise ValueError('municipality must have six digits')
        if sex not in (None, 1, 2) or not 0 <= min_age <= max_age <= 80:
            raise ValueError('invalid sex or age range')
        with duckdb.connect() as db:
            available = {row[0] for row in db.execute('SELECT DISTINCT year FROM read_parquet(?)', [str(self._path)]).fetchall()}
            first_record = dict(db.execute('''SELECT municipality, min(year) FROM read_parquet(?)
                WHERE municipality IN (SELECT unnest(?)) GROUP BY municipality''',
                [str(self._path), list(municipalities)]).fetchall())
            population = {(code, year): total for code, year, total in db.execute('''
                SELECT municipality, year, sum(population) FROM read_parquet(?)
                WHERE municipality IN (SELECT unnest(?)) AND (? IS NULL OR sex = ?)
                AND age BETWEEN ? AND ? GROUP BY municipality, year''',
                [str(self._path), list(municipalities), sex, sex, min_age, max_age]).fetchall()}
        results = {}
        for year in years:
            selected = year if year in available else year - 1
            if selected not in available:
                raise ValueError(f'no population file for {year} or the previous year')
            for code in municipalities:
                if code not in first_record:
                    raise ValueError(f'no population for municipality {code}')
                if year < first_record[code]:
                    continue
                total = population.get((code, selected))
                if total is None:
                    raise ValueError(f'no population for municipality {code} in {selected}')
                results[code, year] = PopulationResult(int(total), selected, selected != year)
        return results
