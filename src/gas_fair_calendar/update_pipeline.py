from __future__ import annotations

from typing import Iterable
from .build_html import build_html
from .collectors.http_html import GenericHTMLCollector
from .collectors.playwright_collector import PlaywrightCollector
from .dedupe import find_duplicates
from .discovery import discover_candidates_from_html
from .export_excel import export_excel
from .io_json import load_events, save_events
from .merge import merge_event
from .models import EventRecord, SourceConfig
from .reporting import write_run_report
from .settings import DATA_DIR, load_sources_config
from .validation import validate_many


def run_collectors() -> list[EventRecord]:
    config = load_sources_config()
    results: list[EventRecord] = []
    for source_dict in config.get("sources", []):
        source = SourceConfig.model_validate(source_dict)
        if not source.enabled:
            continue
        collector = PlaywrightCollector(source) if source.use_playwright else GenericHTMLCollector(source)
        try:
            results.extend(collector.collect())
        except Exception as exc:
            print(f"Collector failed for {source.key}: {exc}")
    return results


def run_discovery() -> list[EventRecord]:
    config = load_sources_config()
    candidates: list[EventRecord] = []
    for source_dict in config.get("sources", []):
        source = SourceConfig.model_validate(source_dict)
        if not source.enabled or not source.discovery:
            continue
        for url in source.list_urls:
            try:
                candidates.extend(discover_candidates_from_html(url, region=source.region, category=source.category))
            except Exception as exc:
                print(f"Discovery failed for {url}: {exc}")
    return candidates


def merge_all(master: list[EventRecord], incoming: list[EventRecord]) -> tuple[list[EventRecord], int, int]:
    index = {event.id: event for event in master}
    added = 0
    updated = 0

    for event in incoming:
        if event.id in index:
            index[event.id] = merge_event(index[event.id], event)
            updated += 1
        else:
            index[event.id] = event
            added += 1

    merged = sorted(index.values(), key=lambda e: (e.start_date, e.name))
    return merged, added, updated


def main() -> None:
    master = load_events(DATA_DIR / "events_master.json")
    collected = run_collectors()
    discovered = run_discovery()
    merged, added, updated = merge_all(master, collected + discovered)

    issues = validate_many(merged)
    duplicates = find_duplicates(merged)

    for event in merged:
        if event.status == "candidate" and event.confidence_score >= 0.78:
            event.status = "confirmed"

    save_events(DATA_DIR / "events_master.json", merged)
    save_events(DATA_DIR / "candidates.json", [e for e in merged if e.status in {"candidate", "needs_review"}])

    build_html()
    export_excel()
    write_run_report(
        issues=[f"{issue.event_id}: {issue.message}" for issue in issues],
        added=added,
        updated=updated,
        duplicates=duplicates,
    )

    print(f"Pipeline completed. Added={added}, Updated={updated}, Issues={len(issues)}, Duplicates={len(duplicates)}")


if __name__ == "__main__":
    main()
