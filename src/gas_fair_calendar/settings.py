from __future__ import annotations

import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
CONFIG_DIR = BASE_DIR / "config"
BUILD_DIR = BASE_DIR / "build"
BACKUP_DIR = DATA_DIR / "backups"
BUILD_DIR.mkdir(exist_ok=True)
BACKUP_DIR.mkdir(exist_ok=True)


def load_sources_config() -> dict:
    json_path = DATA_DIR / "sources.json"
    if json_path.exists():
        return {"sources": json.loads(json_path.read_text(encoding="utf-8"))}
    return {"sources": []}
