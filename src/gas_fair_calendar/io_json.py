from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, TypeVar

from .models import EventRecord, ScanJob, SourceConfig

T = TypeVar("T")


def load_json(path: Path, default: T):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def load_events(path: Path) -> list[EventRecord]:
    return [EventRecord.model_validate(item) for item in load_json(path, [])]


def save_events(path: Path, events: Iterable[EventRecord]) -> None:
    save_json(path, [event.model_dump(mode="json") for event in events])


def load_sources(path: Path) -> list[SourceConfig]:
    return [SourceConfig.model_validate(item) for item in load_json(path, [])]


def save_sources(path: Path, sources: Iterable[SourceConfig]) -> None:
    save_json(path, [source.model_dump(mode="json", by_alias=True) for source in sources])


def load_jobs(path: Path) -> list[ScanJob]:
    return [ScanJob.model_validate(item) for item in load_json(path, [])]


def save_jobs(path: Path, jobs: Iterable[ScanJob]) -> None:
    save_json(path, [job.model_dump(mode="json") for job in jobs])
