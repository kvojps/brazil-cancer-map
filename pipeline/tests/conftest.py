from pathlib import Path

import pytest

# Helper modules hold asserts that run inside tests; rewrite them like test modules.
_TESTS = Path(__file__).parent
pytest.register_assert_rewrite(*(
    ".".join(("pipeline", "tests", *path.relative_to(_TESTS).with_suffix("").parts))
    for path in _TESTS.rglob("helpers.py")
))
