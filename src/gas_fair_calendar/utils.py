from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone, date


def now_utc() -> datetime:
    return datetime.now(timezone.utc).replace(microsecond=0)


def safe_text(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def slugify(value: str) -> str:
    value = safe_text(value).lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "event"


def make_event_id(name: str, year: int | str = "") -> str:
    base = f"{safe_text(name)}|{year}"
    digest = hashlib.sha1(base.encode("utf-8")).hexdigest()[:10]
    return f"evt-{slugify(name)[:32]}-{digest}"


def date_to_day_of_year(value: date | None) -> int:
    if not value:
        return 1
    return int(value.strftime("%j"))
