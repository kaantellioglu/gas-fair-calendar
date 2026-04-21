from __future__ import annotations

from .models import ChangeEntry, EventRecord
from .utils import now_utc

TRACKED_FIELDS = [
    "name",
    "short_name",
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
    "contact",
    "scale",
    "status",
    "confidence_score",
]


def merge_event(old: EventRecord, new: EventRecord) -> EventRecord:
    merged = old.model_copy(deep=True)
    changes = list(merged.change_log)

    for field in TRACKED_FIELDS:
        old_value = getattr(merged, field)
        new_value = getattr(new, field)
        if new_value in (None, "", [], {}):
            continue
        if old_value != new_value:
            setattr(merged, field, new_value)
            changes.append(
                ChangeEntry(
                    timestamp=now_utc(),
                    field=field,
                    old=str(old_value) if old_value not in (None, "") else None,
                    new=str(new_value),
                    source_url=new.source_url or new.website,
                )
            )

    merged.source_url = new.source_url or merged.source_url
    merged.source_type = new.source_type or merged.source_type
    merged.last_checked_at = new.last_checked_at or now_utc()
    merged.last_changed_at = now_utc() if changes != merged.change_log else merged.last_changed_at
    merged.change_log = changes[-50:]
    return merged
