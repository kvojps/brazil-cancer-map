"""Where the pipeline reads and writes."""

from pathlib import Path

PIPELINE_DIR = Path(__file__).resolve().parent
REPO_DIR = PIPELINE_DIR.parent

RAW_DIR = REPO_DIR / "data" / "raw"
"""Raw downloads, outside git."""

CLEAN_DIR = REPO_DIR / "data" / "clean"
"""Standardized intermediate data, outside git."""

SITE_DATA_DIR = REPO_DIR / "site" / "public" / "dados"
"""The data contract read by the site (spec, section 15)."""
