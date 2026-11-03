"""What the pipeline expects from each data source."""

from collections.abc import Callable
from typing import Protocol


class Source(Protocol):
    """A data source (e.g. the IBGE municipal mesh or SIM), with one method per step.

    A step signals failure by raising. Within the same run, the remaining steps
    of that source are skipped: if validation fails, nothing from the source is
    exported.
    """

    name: str

    def download(self) -> None:
        """Download raw data into `data/raw/`, with an incremental cache."""

    def clean(self) -> None:
        """Write standardized Parquet into `data/clean/`."""

    def compute(self) -> None:
        """Compute the indicators. The only place where statistics happen."""

    def validate(self) -> None:
        """Check against official figures; raise on failure."""

    def export(self) -> None:
        """Write the data contract consumed by the site (spec, section 15)."""


STEPS: dict[str, Callable[[Source], None]] = {
    "download": lambda source: source.download(),
    "clean": lambda source: source.clean(),
    "compute": lambda source: source.compute(),
    "validate": lambda source: source.validate(),
    "export": lambda source: source.export(),
}
"""The pipeline steps, in the order they run (spec, section 14)."""
