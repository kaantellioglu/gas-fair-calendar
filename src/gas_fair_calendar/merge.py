from __future__ import annotations

from .models import EventRecord, ChangeEntry
from .utils import now_utc

SOURCE_PRIORITY = {
    "official_site": 5,
    "organizer": 4,
    "association": 3,
    "venue": 2,
    "secondary_backup": 1,
}


def merge_event(existing: EventRecord, incoming: EventRecord) -> EventRecord:
    priority_existing = SOURCE_PRIORITY.get(existing.source_type, 0)
    priority_incoming = SOURCE_PRIORITY.get(incoming.source_type, 0)

    updated = existing.model_copy(deep=True)
    changed = False

    fields_to_compare = [
        "name",
        "start_date",
        "end_date",
        "city",
        "country",
        "region",
        "category",
        "venue",
        "organizer",
        "website",
        "ticket_info",
        "description",
    ]

    for field in fields_to_compare:
        old_val = getattr(updated, field)
        new_val = getattr(incoming, field)
        if new_val and new_val != old_val:
            if priority_incoming >= priority_existing:
                setattr(updated, field, new_val)
                updated.change_log.append(
                    ChangeEntry(
                        timestamp=now_utc(),
                        field=field,
                        old=str(old_val) if old_val is not None else None,
                        new=str(new_val),
                        source_url=incoming.source_url,
                    )
                )
                changed = True
            else:
                updated.status = "needs_review"

    updated.confidence_score = max(updated.confidence_score, incoming.confidence_score)
    updated.last_checked_at = now_utc()
    if changed:
        updated.last_changed_at = now_utc()
    return updated
