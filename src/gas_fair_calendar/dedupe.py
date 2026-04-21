from __future__ import annotations

from datetime import timedelta
from difflib import SequenceMatcher
from .models import EventRecord


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def is_probable_duplicate(left: EventRecord, right: EventRecord, max_days: int = 14) -> bool:
    if left.country.lower() != right.country.lower():
        return False
    if similarity(left.name, right.name) < 0.82:
        return False
    delta = abs((left.start_date - right.start_date).days)
    return delta <= max_days


def find_duplicates(events: list[EventRecord], max_days: int = 14) -> list[tuple[str, str]]:
    duplicates: list[tuple[str, str]] = []
    for i, left in enumerate(events):
        for right in events[i + 1 :]:
            if is_probable_duplicate(left, right, max_days=max_days):
                duplicates.append((left.id, right.id))
    return duplicates
