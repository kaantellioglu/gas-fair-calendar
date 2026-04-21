from __future__ import annotations

from collections import defaultdict

from .models import EventRecord


def find_duplicates(events: list[EventRecord]) -> list[str]:
    seen: dict[tuple[str, str, str], list[str]] = defaultdict(list)
    for event in events:
        key = (event.name.strip().lower(), str(event.start_date or ""), event.city.strip().lower())
        seen[key].append(event.id)
    duplicates: list[str] = []
    for ids in seen.values():
        if len(ids) > 1:
            duplicates.append(", ".join(ids))
    return duplicates
