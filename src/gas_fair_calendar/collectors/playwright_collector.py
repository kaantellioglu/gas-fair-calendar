from __future__ import annotations

from playwright.sync_api import sync_playwright
from dateutil import parser as date_parser

from ..models import EventRecord
from ..utils import make_event_id, now_utc, safe_text
from .base import BaseCollector


class PlaywrightCollector(BaseCollector):
    def collect(self) -> list[EventRecord]:
        events: list[EventRecord] = []
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            for url in self.source.list_urls:
                page.goto(url, wait_until="networkidle")
                title = page.title()
                body_text = page.evaluate("() => document.body.innerText")
                year = 2026
                event = EventRecord(
                    id=make_event_id(title, year),
                    name=safe_text(title),
                    short_name=safe_text(title[:50]),
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
                    description=safe_text(body_text[:600]),
                    source_url=url,
                    source_type=self.source.source_type,
                    status="candidate",
                    confidence_score=0.5,
                    last_checked_at=now_utc(),
                    last_changed_at=now_utc(),
                    change_log=[],
                )
                events.append(event)
            browser.close()
        return events
