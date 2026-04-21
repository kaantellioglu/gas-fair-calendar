from __future__ import annotations

import json
from calendar import monthrange
from datetime import date, datetime
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

from .io_json import load_events
from .settings import DATA_DIR, TEMPLATE_DIR, OUTPUT_DIR

MONTHS_TR = {
    1: "Ocak", 2: "Şubat", 3: "Mart", 4: "Nisan", 5: "Mayıs", 6: "Haziran",
    7: "Temmuz", 8: "Ağustos", 9: "Eylül", 10: "Ekim", 11: "Kasım", 12: "Aralık",
}

FLAG_MAP = {
    "İtalya": "🇮🇹", "İspanya": "🇪🇸", "Hindistan": "🇮🇳", "Bulgaristan": "🇧🇬",
    "Bahreyn": "🇧🇭", "Romanya": "🇷🇴", "Portekiz": "🇵🇹", "Belçika": "🇧🇪",
    "Macaristan": "🇭🇺", "Yunanistan": "🇬🇷", "Hırvatistan": "🇭🇷", "BAE": "🇦🇪",
    "Birleşik Arap Emirlikleri": "🇦🇪", "Umman": "🇴🇲", "İngiltere": "🇬🇧",
    "Türkiye": "🇹🇷", "Özbekistan": "🇺🇿", "Kazakistan": "🇰🇿", "Azerbaycan": "🇦🇿",
    "Mısır": "🇪🇬", "Suudi Arabistan": "🇸🇦", "Katar": "🇶🇦", "Kuveyt": "🇰🇼",
    "Japonya": "🇯🇵", "Singapur": "🇸🇬", "Tayland": "🇹🇭", "Çin": "🇨🇳",
    "Almanya": "🇩🇪", "Fransa": "🇫🇷", "Hollanda": "🇳🇱", "Norveç": "🇳🇴",
    "Polonya": "🇵🇱", "İrlanda": "🇮🇪", "İsviçre": "🇨🇭", "Avusturya": "🇦🇹",
    "Pakistan": "🇵🇰", "Güney Kore": "🇰🇷", "Malezya": "🇲🇾", "Endonezya": "🇮🇩",
    "Vietnam": "🇻🇳", "Avustralya": "🇦🇺", "Türkmenistan": "🇹🇲", "Tacikistan": "🇹🇯",
    "Kırgızistan": "🇰🇬", "Irak": "🇮🇶", "İran": "🇮🇷",
}

REGION_LABELS = {
    "eu": "Avrupa",
    "gcc": "GCC / Orta Doğu",
    "turkic": "Türki Cumhuriyetler",
    "asia": "Asya-Pasifik",
    "global": "Global",
}

TAG_MAP = {
    "lng": "LNG",
    "lpg": "LPG",
    "dist": "GAZ / DAĞITIM",
    "ng": "ENERJİ",
    "equip": "EKİPMAN",
    "boiler": "BOILER",
    "gcc": "GCC-GAZ",
    "asia": "ASYA-GAZ",
}


def _day_of_year(d: date) -> int:
    return d.timetuple().tm_yday


def _format_dates(start: date, end: date) -> str:
    if start.month == end.month:
        return f"{start.day}–{end.day} {MONTHS_TR[start.month]}"
    return f"{start.day} {MONTHS_TR[start.month]} – {end.day} {MONTHS_TR[end.month]}"


def _frontend_event(event, idx: int) -> dict:
    return {
        "id": idx + 1,
        "event_id": event.id,
        "name": event.name,
        "shortName": event.short_name or event.name,
        "dates": _format_dates(event.start_date, event.end_date),
        "s": _day_of_year(event.start_date),
        "e": _day_of_year(event.end_date),
        "city": event.city,
        "country": event.country,
        "flag": FLAG_MAP.get(event.country, "🌐"),
        "region": event.region,
        "type": event.category,
        "tag": TAG_MAP.get(event.category, event.category.upper()),
        "org": event.organizer or "-",
        "venue": event.venue or "-",
        "scale": "Takipte",
        "desc": event.description or "Açıklama henüz eklenmedi.",
        "contact": event.contact or "-",
        "url": event.website or event.source_url or "#",
        "ticket": event.ticket_info or "Bilgi bekleniyor",
        "status": event.status,
        "confidence": float(event.confidence_score),
        "last_checked_at": event.last_checked_at.isoformat() if event.last_checked_at else None,
        "last_changed_at": event.last_changed_at.isoformat() if event.last_changed_at else None,
        "source_url": event.source_url or event.website or "",
        "source_type": event.source_type,
        "region_label": REGION_LABELS.get(event.region, event.region),
    }


def build_html() -> Path:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
    )
    template = env.get_template("dashboard_original.html.j2")
    events = sorted(load_events(DATA_DIR / "events_master.json"), key=lambda e: (e.start_date, e.name))
    frontend_events = [_frontend_event(e, idx) for idx, e in enumerate(events)]
    last_sync = max((e.last_checked_at for e in events if e.last_checked_at), default=None)
    build_meta = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "last_sync": last_sync.isoformat() if last_sync else None,
        "total": len(events),
        "confirmed": sum(1 for e in events if e.status == "confirmed"),
        "needs_review": sum(1 for e in events if e.status == "needs_review"),
        "candidate": sum(1 for e in events if e.status == "candidate"),
        "regions": sorted({e.region for e in events}),
        "countries": len({e.country for e in events}),
    }
    output = template.render(
        events_json=json.dumps(frontend_events, ensure_ascii=False),
        build_meta_json=json.dumps(build_meta, ensure_ascii=False),
    )
    output_path = OUTPUT_DIR / "GAZ-FUAR_TAKVIMI-OTOMATIK.html"
    output_path.write_text(output, encoding="utf-8")
    return output_path


if __name__ == "__main__":
    path = build_html()
    print(f"HTML created: {path}")
