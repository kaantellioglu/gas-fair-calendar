from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone
from typing import Optional


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def make_event_id(name: str, year: int) -> str:
    return f"evt-{slugify(name)}-{year}"


def stable_hash(*parts: str) -> str:
    joined = "||".join(part or "" for part in parts)
    return hashlib.sha1(joined.encode("utf-8")).hexdigest()[:12]


def safe_text(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", value or "").strip()
