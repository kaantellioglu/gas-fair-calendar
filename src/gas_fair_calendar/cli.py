from __future__ import annotations

import argparse
import json

from .build_html import build_html
from .export_excel import export_excel
from .frontend import build_frontend_json
from .pipeline import run_auto_update
from .seed import seed_master_from_frontend
from .settings import DATA_DIR
from .io_json import load_events


def main() -> None:
    parser = argparse.ArgumentParser(prog="gas-fair-calendar")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("seed-master", help="Rebuild events_master.json from frontend seed data")
    sub.add_parser("build-frontend", help="Rebuild data/events_frontend.json from events_master.json")
    sub.add_parser("build-html", help="Copy the current UX index into build output")
    sub.add_parser("export-excel", help="Export events_master.xlsx")
    p_update = sub.add_parser("auto-update", help="Run full automatic Python update pipeline")
    p_update.add_argument("--no-seed", action="store_true", help="Do not seed master data when empty")
    sub.add_parser("stats", help="Print dataset stats")

    args = parser.parse_args()

    if args.command == "seed-master":
        events = seed_master_from_frontend()
        print(f"Seeded master dataset with {len(events)} events.")
    elif args.command == "build-frontend":
        path = build_frontend_json()
        print(path)
    elif args.command == "build-html":
        path = build_html()
        print(path)
    elif args.command == "export-excel":
        path = export_excel()
        print(path)
    elif args.command == "auto-update":
        result = run_auto_update(seed_if_empty=not args.no_seed)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    elif args.command == "stats":
        events = load_events(DATA_DIR / "events_master.json")
        print(json.dumps({
            "events": len(events),
            "confirmed": sum(1 for e in events if e.status == "confirmed"),
            "candidate": sum(1 for e in events if e.status == "candidate"),
        }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
