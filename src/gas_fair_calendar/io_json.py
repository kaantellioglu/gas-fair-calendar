from __future__ import annotations

import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from .models import EventRecord


def load_events(path: Path) -> list[EventRecord]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [EventRecord.model_validate(item) for item in raw]


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def backup_json(path: Path, backup_dir: Path) -> Path | None:
    if not path.exists():
        return None
    ensure_parent(backup_dir / 'x')
    timestamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    backup_path = backup_dir / f"{path.stem}_{timestamp}{path.suffix}"
    shutil.copy2(path, backup_path)
    return backup_path


def save_events(path: Path, events: Iterable[EventRecord]) -> None:
    ensure_parent(path)
    serializable = [e.model_dump(mode="json") for e in events]
    tmp_path = path.with_suffix(path.suffix + '.tmp')
    tmp_path.write_text(json.dumps(serializable, ensure_ascii=False, indent=2), encoding='utf-8')
    tmp_path.replace(path)
