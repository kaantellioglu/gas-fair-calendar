from __future__ import annotations

from bs4 import BeautifulSoup
import requests
from dateutil import parser as date_parser
from .models import EventRecord
from .utils import make_event_id, now_utc, safe_text


KEYWORDS = [
    "gas",
    "lng",
    "lpg",
    "boiler",
    "burner",
    "pipeline",
    "energy summit",
    "petroleum",
]


def discover_candidates_from_html(url: str, region: str = "global", category: str = "ng") -> list[EventRecord]:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    text = soup.get_text(" ", strip=True)
    lowered = text.lower()

    if not any(keyword in lowered for keyword in KEYWORDS):
        return []

    title = safe_text(soup.title.text if soup.title else url)
    year = 2026
    event = EventRecord(
        id=make_event_id(title, year),
        name=title,
        short_name=title[:50],
        start_date=date_parser.parse(f"2026-01-01").date(),
        end_date=date_parser.parse(f"2026-01-01").date(),
        city="Unknown",
        country="Unknown",
        region=region,
        category=category,
        venue="",
        organizer="",
        website=url,
        description=safe_text(text[:500]),
        source_url=url,
        source_type="secondary_backup",
        status="candidate",
        confidence_score=0.35,
        last_checked_at=now_utc(),
        last_changed_at=now_utc(),
        change_log=[],
    )
    return [event]
