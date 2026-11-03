"""Writing the data contract read by the site (spec, section 15)."""

import json
import subprocess
import tomllib
from pathlib import Path
from typing import Any

from pipeline.paths import REPO_DIR

MANIFEST = "manifest.json"


def publish_together(directory: Path, files: dict[str, object]) -> None:
    """Write every file before replacing any, so a failed write leaves the old set whole.

    Keys are paths relative to `directory`; values are serialized as compact JSON.
    """
    staged = []
    for name, content in files.items():
        dest = directory / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        partial = dest.with_name(dest.name + ".part")
        partial.write_text(json.dumps(content, ensure_ascii=False, separators=(",", ":")))
        staged.append((partial, dest))
    for partial, dest in staged:
        partial.replace(dest)


def updated_manifest(directory: Path, *, source: str, extract: dict[str, Any], indicators: dict[str, Any]) -> dict[str, Any]:
    """The manifest with one source's entries replaced and every other source's kept.

    It records the pipeline version, each source's extraction and each
    indicator's published period, keyed by cancer type.
    """
    path = directory / MANIFEST
    manifest: dict[str, Any] = json.loads(path.read_text()) if path.exists() else {}
    manifest["pipeline_version"] = pipeline_version()
    manifest.setdefault("sources", {})[source] = extract
    manifest.setdefault("indicators", {}).update(indicators)
    return manifest


def pipeline_version() -> str:
    """The version in `pyproject.toml`, plus the git commit when there is one."""
    version = str(tomllib.loads((REPO_DIR / "pyproject.toml").read_text())["project"]["version"])
    try:
        commit = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=REPO_DIR, capture_output=True, text=True, check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return version
    return f"{version}+{commit}"
