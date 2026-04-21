from __future__ import annotations

from datetime import date
from pathlib import Path

from .io_json import load_json, save_events
from .models import EventRecord
from .settings import DATA_DIR
from .utils import make_event_id

REGION_BY_COUNTRY = {
    "İtalya": "eu", "İspanya": "eu", "Hindistan": "asia", "Bulgaristan": "eu", "Bahreyn": "gcc",
    "Romanya": "eu", "Portekiz": "eu", "Belçika": "eu", "Macaristan": "eu", "Yunanistan": "eu",
    "Hırvatistan": "eu", "BAE": "gcc", "Umman": "gcc", "İngiltere": "eu", "Mısır": "gcc",
    "Azerbaycan": "turkic", "Özbekistan": "turkic", "Kazakistan": "turkic", "Tayland": "asia", "Singapur": "asia",
    "Türkiye": "eu", "Japonya": "asia", "Güney Afrika": "gcc", "Çin": "asia", "Almanya": "eu",
}


def parse_day_to_date(day_of_year: int | None, year: int = 2026) -> date | None:
    if not day_of_year:
        return None
    return date(year, 1, 1).fromordinal(date(year, 1, 1).toordinal() + int(day_of_year) - 1)


def seed_master_from_frontend() -> list[EventRecord]:
    frontend = load_json(DATA_DIR / "events_frontend.json", [])
    events: list[EventRecord] = []
    for item in frontend:
        start = parse_day_to_date(item.get("s"))
        end = parse_day_to_date(item.get("e"))
        events.append(
            EventRecord(
                id=make_event_id(item.get("name", "event"), 2026),
                name=item.get("name", ""),
                short_name=item.get("shortName") or item.get("name", ""),
                start_date=start,
                end_date=end,
                city=item.get("city", ""),
                country=item.get("country", ""),
                region=item.get("region") or REGION_BY_COUNTRY.get(item.get("country", ""), "global"),
                category=item.get("type", "ng"),
                venue=item.get("venue", ""),
                organizer=item.get("org", ""),
                website=item.get("url"),
                ticket_info=item.get("ticket", ""),
                description=item.get("desc", ""),
                contact=item.get("contact", ""),
                scale=item.get("scale", ""),
                source_url=item.get("url"),
                source_type="seed_html",
                status=item.get("status", "seeded"),
                confidence_score=float(item.get("confidence", 0.8) or 0.8),
            )
        )
    save_events(DATA_DIR / "events_master.json", events)
    return events
