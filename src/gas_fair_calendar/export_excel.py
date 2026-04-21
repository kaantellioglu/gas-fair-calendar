from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook

from .io_json import load_events
from .settings import BUILD_DIR, DATA_DIR


HEADERS = [
    "Name",
    "Short Name",
    "Start Date",
    "End Date",
    "City",
    "Country",
    "Region",
    "Category",
    "Venue",
    "Organizer",
    "Website",
    "Ticket Info",
    "Description",
    "Contact",
    "Scale",
    "Source URL",
    "Source Type",
    "Status",
    "Confidence Score",
    "Last Checked At",
]


def export_excel() -> Path:
    wb = Workbook()
    ws = wb.active
    ws.title = "Events"
    ws.append(HEADERS)

    for event in load_events(DATA_DIR / "events_master.json"):
        ws.append([
            event.name,
            event.short_name,
            event.start_date.isoformat() if event.start_date else "",
            event.end_date.isoformat() if event.end_date else "",
            event.city,
            event.country,
            event.region,
            event.category,
            event.venue,
            event.organizer,
            event.website or "",
            event.ticket_info,
            event.description,
            event.contact,
            event.scale,
            event.source_url or "",
            event.source_type,
            event.status,
            event.confidence_score,
            event.last_checked_at.isoformat() if event.last_checked_at else "",
        ])

    widths = {1: 36, 2: 24, 3: 14, 4: 14, 5: 18, 6: 18, 7: 10, 8: 12, 9: 30, 10: 24, 11: 34, 12: 24, 13: 60, 14: 22, 15: 24, 16: 34, 17: 18, 18: 14, 19: 16, 20: 26}
    for idx, width in widths.items():
        ws.column_dimensions[chr(64 + idx)].width = width

    out = BUILD_DIR / "events_master.xlsx"
    wb.save(out)
    return out
