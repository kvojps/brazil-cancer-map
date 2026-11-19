"""Fixed Situação bands relative to an indicator's reference (spec, section 9)."""

import math
from typing import Literal

Status = Literal["reached", "near", "far"]
ABOVE_EXPECTED_NOTE = "valor acima do esperado, provavelmente erro no registro ou na estimativa de população"


def classify_status(value: float | None, *, reference: float, lower_is_better: bool = False) -> Status | None:
    """Compare an unrounded value with fixed bands, reversing them for smoking."""
    if value is None:
        return None
    if lower_is_better:
        near_cut = round(reference / 0.8, 1)
        return "reached" if value <= reference or math.isclose(value, reference, abs_tol=1e-12, rel_tol=0) else "near" if value <= near_cut or math.isclose(value, near_cut, abs_tol=1e-12, rel_tol=0) else "far"
    return "reached" if value >= reference else "near" if value >= 0.8 * reference else "far"


def status_note(value: float | None, *, maximum: float) -> str | None:
    """Flag an implausible value without clamping it; each source sets its limit."""
    return ABOVE_EXPECTED_NOTE if value is not None and value > maximum else None
