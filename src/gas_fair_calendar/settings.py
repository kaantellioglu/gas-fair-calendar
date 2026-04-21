from __future__ import annotations

import os
from pathlib import Path
import yaml

PACKAGE_DIR = Path(__file__).resolve().parent
BASE_DIR = PACKAGE_DIR.parents[1]
DEFAULT_DATA_DIR = BASE_DIR / 'data'
DEFAULT_OUTPUT_DIR = BASE_DIR / 'build'
DEFAULT_CONFIG_FILE = BASE_DIR / 'config' / 'sources.yaml'
TEMPLATE_DIR = PACKAGE_DIR / 'templates'
DEFAULT_BACKUP_DIR = DEFAULT_DATA_DIR / 'backups'


def _resolve_from_env(name: str, default: Path) -> Path:
    value = os.getenv(name)
    return Path(value).expanduser().resolve() if value else default


DATA_DIR = _resolve_from_env('GFC_DATA_DIR', DEFAULT_DATA_DIR)
OUTPUT_DIR = _resolve_from_env('GFC_OUTPUT_DIR', DEFAULT_OUTPUT_DIR)
CONFIG_FILE = _resolve_from_env('GFC_CONFIG_FILE', DEFAULT_CONFIG_FILE)
BACKUP_DIR = _resolve_from_env('GFC_BACKUP_DIR', DEFAULT_BACKUP_DIR)

DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def load_sources_config() -> dict:
    with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f) or {}
    config.setdefault('defaults', {})
    defaults = config['defaults']
    defaults.setdefault('target_years', [2026, 2027])
    defaults.setdefault('min_confidence_to_publish', 0.78)
    defaults.setdefault('max_duplicate_distance_days', 14)
    defaults.setdefault('minimum_incoming_records_guard', 0)
    return config
