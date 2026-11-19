"""Dependency rules between the parts of the pipeline package (spec #66).

No source imports another source, and nothing in ``steps/`` imports
``sources`` or ``operations``.
"""

import ast
from pathlib import Path

from pipeline.paths import PIPELINE_DIR

PACKAGE = "pipeline"


def _module_name(path: Path, root: Path) -> str:
    parts = list(path.relative_to(root).with_suffix("").parts)
    if parts[-1] == "__init__":
        parts.pop()
    return ".".join([PACKAGE, *parts])


def _imports(path: Path, root: Path) -> set[str]:
    """Every module a file imports, with relative imports resolved."""
    module = _module_name(path, root)
    package = module if path.name == "__init__.py" else module.rpartition(".")[0]
    found: set[str] = set()
    for node in ast.walk(ast.parse(path.read_text(), filename=str(path))):
        if isinstance(node, ast.Import):
            found.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            base = node.module or ""
            if node.level:
                anchor = package.split(".")[: len(package.split(".")) - node.level + 1]
                base = ".".join([*anchor, *([base] if base else [])])
            found.add(base)
            found.update(f"{base}.{alias.name}" for alias in node.names)
    return found


def _source_of(module: str) -> str | None:
    """The source a module belongs to, or None outside a source."""
    parts = module.split(".")
    if parts[:2] == [PACKAGE, "sources"] and len(parts) > 2:
        return parts[2]
    return None


def _is_under(module: str, package: str) -> bool:
    return module == package or module.startswith(package + ".")


def _checked_files(root: Path) -> list[Path]:
    """The package's own modules, without tests and Node tooling."""
    return [
        path for path in root.rglob("*.py")
        if path.relative_to(root).parts[0] not in {"tests", "node_modules"}
    ]


def violations(root: Path) -> list[str]:
    """Imports in the package at ``root`` that break the dependency rules."""
    broken: set[str] = set()
    for path in _checked_files(root):
        module = _module_name(path, root)
        source = _source_of(module)
        for imported in _imports(path, root):
            other = _source_of(imported)
            if source is not None and other is not None and other != source:
                broken.add(f"{module} imports source {other}")
            if _is_under(module, f"{PACKAGE}.steps"):
                for forbidden in ("sources", "operations"):
                    if _is_under(imported, f"{PACKAGE}.{forbidden}"):
                        broken.add(f"{module} imports {forbidden}")
    return sorted(broken)


def _write(root: Path, files: dict[str, str]) -> Path:
    for name, text in files.items():
        path = root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
    return root


def test_pipeline_follows_the_dependency_rules() -> None:
    assert violations(PIPELINE_DIR) == []


def test_the_dependency_rules_reach_every_shared_step() -> None:
    checked = {_module_name(path, PIPELINE_DIR) for path in _checked_files(PIPELINE_DIR)}

    assert {
        f"{PACKAGE}.steps.download",
        f"{PACKAGE}.steps.compute",
        f"{PACKAGE}.steps.export",
    } <= checked


def test_a_source_importing_another_source_is_a_violation(tmp_path: Path) -> None:
    root = _write(tmp_path, {
        "sources/__init__.py": "from pipeline.sources.a import A\nfrom pipeline.sources.b import B\n",
        "sources/a/__init__.py": "from pipeline.sources.a.model import A\nfrom . import model\n",
        "sources/a/model.py": "from pipeline.paths import X\nfrom pipeline.steps.compute import f\n",
        "sources/b.py": "from pipeline.sources.a import A\n",
        "sources/c.py": "from pipeline.sources import b\n",
        "sources/d/__init__.py": "from ..a import model\n",
    })

    assert violations(root) == [
        "pipeline.sources.b imports source a",
        "pipeline.sources.c imports source b",
        "pipeline.sources.d imports source a",
    ]


def test_steps_importing_sources_or_operations_is_a_violation(tmp_path: Path) -> None:
    root = _write(tmp_path, {
        "steps/compute.py": "from pipeline.paths import X\nimport pipeline.operations.update\n",
        "steps/export/__init__.py": "from pipeline.sources import SOURCES\n",
    })

    assert violations(root) == [
        "pipeline.steps.compute imports operations",
        "pipeline.steps.export imports sources",
    ]
