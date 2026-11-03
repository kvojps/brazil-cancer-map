from pipeline.cli import main

Log = list[tuple[str, str]]


def run_cli(argv, sources):
    """Run the CLI and return its exit code, including when argparse exits."""
    try:
        return main(argv, sources=sources)
    except SystemExit as exit_:
        return exit_.code


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


def test_run_executes_the_five_steps_in_order():
    log: Log = []
    code = run_cli(["run"], sources=[FakeSource("mesh", log)])

    assert code == 0
    assert log == [
        ("mesh", "download"),
        ("mesh", "clean"),
        ("mesh", "compute"),
        ("mesh", "validate"),
        ("mesh", "export"),
    ]


def test_run_with_source_executes_only_that_source():
    log: Log = []
    sources = [FakeSource("mesh", log), FakeSource("sim", log)]

    code = run_cli(["run", "--source", "sim"], sources=sources)

    assert code == 0
    assert [name for name, _ in log] == ["sim"] * 5


def test_run_with_step_executes_only_that_step_for_each_source():
    log: Log = []
    sources = [FakeSource("mesh", log), FakeSource("sim", log)]

    code = run_cli(["run", "--step", "clean"], sources=sources)

    assert code == 0
    assert log == [("mesh", "clean"), ("sim", "clean")]


def test_unknown_source_is_an_error_and_nothing_runs(capsys):
    log: Log = []

    code = run_cli(["run", "--source", "missing"], sources=[FakeSource("mesh", log)])

    assert code != 0
    assert log == []
    assert "missing" in capsys.readouterr().err


def test_unknown_step_is_an_error_and_nothing_runs():
    log: Log = []

    code = run_cli(["run", "--step", "publish"], sources=[FakeSource("mesh", log)])

    assert code != 0
    assert log == []


def test_failed_validation_blocks_export_of_that_source_and_others_continue(capsys):
    log: Log = []
    sources = [
        FakeSource("mesh", log, fails_at="validate"),
        FakeSource("sim", log),
    ]

    code = run_cli(["run"], sources=sources)

    assert code != 0
    assert ("mesh", "validate") in log
    assert ("mesh", "export") not in log
    assert ("sim", "export") in log
    assert "mesh failed at validate" in capsys.readouterr().err


def test_list_shows_steps_and_sources_without_running(capsys):
    log: Log = []
    sources = [FakeSource("mesh", log), FakeSource("sim", log)]

    code = run_cli(["run", "--list"], sources=sources)

    output = capsys.readouterr().out
    assert code == 0
    assert log == []
    assert "download → clean → compute → validate → export" in output
    assert "mesh" in output and "sim" in output
