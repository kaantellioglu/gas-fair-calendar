from __future__ import annotations

import json
import re
from datetime import date, timedelta, datetime, timezone
from pathlib import Path

from .io_json import backup_json, load_events, save_events
from .merge import merge_all_events
from .models import ChangeEntry, EventRecord
from .settings import BACKUP_DIR, DATA_DIR


def _parse_ev_array(html_text: str) -> list[dict]:
    match = re.search(r"const EV = \[(.*?)\n\];", html_text, re.S)
    if not match:
        raise ValueError('Could not find EV array in HTML file')
    js = '[' + match.group(1) + ']'
    js = re.sub(r'([\{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', js)
    js = re.sub(r',\s*([}\]])', r'\1', js)
    return json.loads(js)


def _to_event(item: dict) -> EventRecord:
    base = date(2026, 1, 1)
    start_date = base + timedelta(days=int(item['s']) - 1)
    end_date = base + timedelta(days=int(item['e']) - 1)
    slug = re.sub(r'[^a-z0-9]+', '-', item['name'].lower()).strip('-')[:80]
    source_url = item.get('url') if item.get('url') and item.get('url') != '#' else None
    now = datetime.now(timezone.utc)
    return EventRecord(
        id=f'evt-{slug}', name=item['name'], short_name=item.get('shortName'),
        start_date=start_date, end_date=end_date, city=item['city'], country=item['country'],
        region=item['region'], category=item['type'], venue=item.get('venue', ''),
        organizer=item.get('org', ''), website=source_url, ticket_info=item.get('ticket', ''),
        description=item.get('desc', ''), contact=item.get('contact', ''), source_url=source_url,
        source_type='secondary_backup', status='confirmed', confidence_score=0.82,
        last_checked_at=now, last_changed_at=now,
        change_log=[ChangeEntry(timestamp=now, field='created', old=None, new='imported-from-html-seed', source_url=source_url)],
    )


def seed_from_html(html_path: Path) -> tuple[int, int, Path | None]:
    html_text = html_path.read_text(encoding='utf-8')
    incoming = [_to_event(item) for item in _parse_ev_array(html_text)]
    master_path = DATA_DIR / 'events_master.json'
    backup = backup_json(master_path, BACKUP_DIR)
    existing = load_events(master_path)
    merged, added, updated = merge_all_events(existing, incoming)
    save_events(master_path, merged)
    return added, updated, backup
