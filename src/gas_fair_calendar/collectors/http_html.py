from __future__ import annotations

import re
import requests
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

from ..models import EventRecord, SourceConfig
from ..utils import make_event_id, now_utc, safe_text
from .base import BaseCollector


class GenericHTMLCollector(BaseCollector):
    def collect(self) -> list[EventRecord]:
        events: list[EventRecord] = []
        for url in self.source.list_urls:
            response = requests.get(url, timeout=30, headers={"User-Agent": "GasFairCalendarBot/1.0"})
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "lxml")

            text = soup.get_text(" ", strip=True)
            year_match = re.search(r"\b(2026|2027)\b", text)
            year = int(year_match.group(1)) if year_match else 2026

            title = safe_text(soup.title.text if soup.title else self.source.key)
            event = EventRecord(
                id=make_event_id(title, year),
                name=title,
                short_name=title[:50],
                start_date=date_parser.parse(f"{year}-01-01").date(),
                end_date=date_parser.parse(f"{year}-01-01").date(),
                city="Unknown",
                country="Unknown",
                region=self.source.region,
                category=self.source.category,
                venue="",
                organizer="",
                website=self.source.url,
                ticket_info="Check official site",
                description=safe_text(text[:600]),
                source_url=url,
                source_type=self.source.source_type,
                status="candidate",
                confidence_score=0.55,
                last_checked_at=now_utc(),
                last_changed_at=now_utc(),
                change_log=[],
            )
            events.append(event)
        return events
