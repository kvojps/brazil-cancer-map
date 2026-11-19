"""Helpers shared by tests in more than one part of the pipeline."""

import json

import duckdb


class FakeSource:
    """Source that logs the steps it runs, and can fail at one of them."""

    def __init__(self, name, log, fails_at=None):
        self.name = name
        self._log = log
        self._fails_at = fails_at

    def _run(self, step):
        self._log.append((self.name, step))
        if step == self._fails_at:
            raise RuntimeError(f"{self.name} failed at {step}")

    def download(self):
        self._run("download")

    def clean(self):
        self._run("clean")

    def compute(self):
        self._run("compute")

    def validate(self):
        self._run("validate")

    def export(self):
        self._run("export")


def documents(directory):
    return {p.relative_to(directory).as_posix(): json.loads(p.read_text())
            for p in directory.rglob('*.json')}


def intermediate_state(clean):
    result = {'json': documents(clean), 'parquet': {}}
    with duckdb.connect() as db:
        for path in sorted(clean.rglob('*.parquet')):
            cursor = db.execute('SELECT * FROM read_parquet(?) ORDER BY ALL', [str(path)])
            result['parquet'][path.relative_to(clean).as_posix()] = {
                'columns': [column[0] for column in cursor.description],
                'rows': cursor.fetchall(),
            }
    return result


def assert_baseline(path, actual):
    expected = json.loads(path.read_text())
    # JSON canonicalization preserves 1 vs 1.0, booleans and nulls; SQL rows
    # compare logically rather than depending on Parquet compression bytes.
    assert json.dumps(actual, sort_keys=True) == json.dumps(expected, sort_keys=True)
