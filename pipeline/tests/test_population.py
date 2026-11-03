import duckdb
import pytest

from pipeline.population import Population


def population_file(tmp_path):
    path = tmp_path / 'population.parquet'
    with duckdb.connect() as db:
        db.execute('CREATE TABLE population (municipality VARCHAR, year INTEGER, sex INTEGER, age INTEGER, population BIGINT)')
        db.execute("INSERT INTO population VALUES ('261160',2024,2,49,10), ('261160',2024,2,50,20), ('261160',2024,2,69,30), ('261160',2024,2,70,40), ('261160',2024,1,50,60), ('510183',2025,2,50,5), ('261160',2025,2,80,7)")
        db.execute('COPY population TO ? (FORMAT PARQUET)', [str(path)])
    return Population(path)


def test_population_selects_inclusive_age_range_and_sex(tmp_path):
    result = population_file(tmp_path).get('261160', 2024, sex=2, min_age=50, max_age=69)
    assert (result.population, result.year, result.provisional) == (50, 2024, False)


def test_missing_file_uses_only_previous_year_and_marks_provisional(tmp_path):
    population = population_file(tmp_path)
    result = population.get('510183', 2026)
    assert (result.population, result.year, result.provisional) == (5, 2025, True)
    with pytest.raises(ValueError, match='previous year'):
        population.get('510183', 2027)


def test_new_municipality_has_no_backfilled_history(tmp_path):
    population = population_file(tmp_path)
    with pytest.raises(ValueError, match='municipality'):
        population.get('510183', 2024)
    # A missing municipality never triggers fallback when the year exists.
    with pytest.raises(ValueError, match='municipality'):
        population.get('999999', 2025)
    assert population.get('261160', 2025, min_age=80).population == 7
