from __future__ import annotations

from pathlib import Path
import yaml

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
CONFIG_DIR = BASE_DIR / "config"
TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"
OUTPUT_DIR = BASE_DIR / "build"
OUTPUT_DIR.mkdir(exist_ok=True)


def load_sources_config() -> dict:
    with open(CONFIG_DIR / "sources.yaml", "r", encoding="utf-8") as f:
        return yaml.safe_load(f)
