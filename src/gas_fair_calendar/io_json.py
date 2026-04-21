from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable
from .models import EventRecord


def load_events(path: Path) -> list[EventRecord]:
    if not path.exists():
        return []
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [EventRecord.model_validate(item) for item in raw]


def save_events(path: Path, events: Iterable[EventRecord]) -> None:
    serializable = [e.model_dump(mode="json") for e in events]
    path.write_text(json.dumps(serializable, ensure_ascii=False, indent=2), encoding="utf-8")
