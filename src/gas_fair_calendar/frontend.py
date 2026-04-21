from __future__ import annotations

from datetime import date
from pathlib import Path

from .io_json import load_events, save_json
from .models import EventRecord
from .settings import BUILD_DIR, DATA_DIR
from .utils import date_to_day_of_year

FLAG_BY_COUNTRY = {
    "İtalya": "🇮🇹", "İspanya": "🇪🇸", "Hindistan": "🇮🇳", "Bulgaristan": "🇧🇬", "Bahreyn": "🇧🇭",
    "Romanya": "🇷🇴", "Portekiz": "🇵🇹", "Belçika": "🇧🇪", "Macaristan": "🇭🇺", "Yunanistan": "🇬🇷",
    "Hırvatistan": "🇭🇷", "BAE": "🇦🇪", "Umman": "🇴🇲", "İngiltere": "🇬🇧", "Mısır": "🇪🇬",
    "Azerbaycan": "🇦🇿", "Özbekistan": "🇺🇿", "Kazakistan": "🇰🇿", "Tayland": "🇹🇭", "Singapur": "🇸🇬",
    "Türkiye": "🇹🇷", "Japonya": "🇯🇵", "Güney Afrika": "🇿🇦", "Çin": "🇨🇳", "Almanya": "🇩🇪",
}
TAG_BY_CATEGORY = {
    "lng": "LNG",
    "lpg": "LPG",
    "dist": "DAĞITIM",
    "ng": "ENERJİ",
    "equip": "EKİPMAN",
    "boiler": "BOILER",
    "gcc": "GCC-GAZ",
    "asia": "ASYA-GAZ",
}
MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]


def format_date_range(start: date | None, end: date | None) -> str:
    if not start and not end:
        return "Tarih doğrulanıyor"
    if start and not end:
        return f"{start.day} {MONTHS_TR[start.month-1]}"
    if not start and end:
        return f"{end.day} {MONTHS_TR[end.month-1]}"
    assert start and end
    if start.month == end.month:
        return f"{start.day}–{end.day} {MONTHS_TR[start.month-1]}"
    return f"{start.day} {MONTHS_TR[start.month-1]} – {end.day} {MONTHS_TR[end.month-1]}"


def event_to_frontend(event: EventRecord, idx: int) -> dict:
    return {
        "id": idx,
        "name": event.name,
        "shortName": event.short_name or event.name,
        "dates": format_date_range(event.start_date, event.end_date),
        "s": date_to_day_of_year(event.start_date),
        "e": date_to_day_of_year(event.end_date),
        "city": event.city,
        "country": event.country,
        "flag": FLAG_BY_COUNTRY.get(event.country, "🌐"),
        "region": event.region,
        "type": event.category,
        "tag": TAG_BY_CATEGORY.get(event.category, event.category.upper()),
        "org": event.organizer,
        "venue": event.venue,
        "scale": event.scale,
        "desc": event.description,
        "contact": event.contact,
        "url": event.website,
        "ticket": event.ticket_info,
        "status": event.status,
        "confidence": event.confidence_score,
        "sourceType": event.source_type,
        "lastCheckedAt": event.last_checked_at.isoformat() if event.last_checked_at else None,
    }


def build_frontend_json() -> Path:
    events = sorted(load_events(DATA_DIR / "events_master.json"), key=lambda e: (e.start_date or date(2026, 1, 1), e.name))
    payload = [event_to_frontend(event, i + 1) for i, event in enumerate(events)]
    data_path = DATA_DIR / "events_frontend.json"
    build_path = BUILD_DIR / "events_frontend.json"
    save_json(data_path, payload)
    save_json(build_path, payload)
    return data_path
