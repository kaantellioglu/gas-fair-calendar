from __future__ import annotations

from pathlib import Path
from collections import Counter
from .io_json import load_events
from .settings import DATA_DIR, OUTPUT_DIR


def write_run_report(issues: list[str], added: int, updated: int, duplicates: list[tuple[str, str]]) -> Path:
    events = load_events(DATA_DIR / "events_master.json")
    by_region = Counter(e.region for e in events)
    by_category = Counter(e.category for e in events)

    lines = []
    lines.append("# Run Report")
    lines.append("")
    lines.append(f"Total events: {len(events)}")
    lines.append(f"Added: {added}")
    lines.append(f"Updated: {updated}")
    lines.append(f"Potential duplicates: {len(duplicates)}")
    lines.append("")
    lines.append("## Region distribution")
    for key, value in sorted(by_region.items()):
        lines.append(f"- {key}: {value}")
    lines.append("")
    lines.append("## Category distribution")
    for key, value in sorted(by_category.items()):
        lines.append(f"- {key}: {value}")
    lines.append("")
    lines.append("## Issues")
    if issues:
        for item in issues:
            lines.append(f"- {item}")
    else:
        lines.append("- None")

    report_path = OUTPUT_DIR / "run_report.md"
    report_path.write_text("\n".join(lines), encoding="utf-8")
    return report_path
