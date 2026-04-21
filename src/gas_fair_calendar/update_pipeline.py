from __future__ import annotations

from .build_html import build_html
from .collectors.http_html import GenericHTMLCollector
from .collectors.playwright_collector import PlaywrightCollector
from .dedupe import find_duplicates
from .discovery import discover_candidates_from_html
from .export_excel import export_excel
from .io_json import backup_json, load_events, save_events
from .merge import merge_all_events
from .models import EventRecord, SourceConfig
from .reporting import write_run_report
from .settings import BACKUP_DIR, DATA_DIR, load_sources_config
from .validation import validate_many


def run_collectors() -> list[EventRecord]:
    config = load_sources_config()
    results: list[EventRecord] = []
    for source_dict in config.get('sources', []):
        source = SourceConfig.model_validate(source_dict)
        if not source.enabled:
            continue
        collector = PlaywrightCollector(source) if source.use_playwright else GenericHTMLCollector(source)
        try:
            results.extend(collector.collect())
        except Exception as exc:
            print(f'Collector failed for {source.key}: {exc}')
    return results


def run_discovery() -> list[EventRecord]:
    config = load_sources_config()
    candidates: list[EventRecord] = []
    for source_dict in config.get('sources', []):
        source = SourceConfig.model_validate(source_dict)
        if not source.enabled or not source.discovery:
            continue
        for url in source.list_urls:
            try:
                candidates.extend(discover_candidates_from_html(url, region=source.region, category=source.category))
            except Exception as exc:
                print(f'Discovery failed for {url}: {exc}')
    return candidates


def main() -> None:
    config = load_sources_config()
    min_confidence = float(config.get('defaults', {}).get('min_confidence_to_publish', 0.78))
    guard_min_records = int(config.get('defaults', {}).get('minimum_incoming_records_guard', 0))

    master_path = DATA_DIR / 'events_master.json'
    master = load_events(master_path)
    collected = run_collectors()
    discovered = run_discovery()
    incoming = collected + discovered

    if guard_min_records and len(incoming) < guard_min_records:
        print(f'Incoming records ({len(incoming)}) below guard threshold ({guard_min_records}). Master file kept as-is.')
        incoming = []

    backup_path = backup_json(master_path, BACKUP_DIR)
    merged, added, updated = merge_all_events(master, incoming)

    issues = validate_many(merged)
    duplicates = find_duplicates(merged)

    for event in merged:
        if event.status == 'candidate' and event.confidence_score >= min_confidence:
            event.status = 'confirmed'

    save_events(master_path, merged)
    save_events(DATA_DIR / 'candidates.json', [e for e in merged if e.status in {'candidate', 'needs_review'}])

    html_path = build_html()
    excel_path = export_excel()
    reports = write_run_report(
        issues=[f'{issue.event_id}: {issue.message}' for issue in issues],
        added=added, updated=updated, duplicates=duplicates, backup_path=backup_path, incoming_count=len(incoming),
    )

    print(
        'Pipeline completed. '
        f'Added={added}, Updated={updated}, Incoming={len(incoming)}, Issues={len(issues)}, Duplicates={len(duplicates)}\n'
        f'Backup={backup_path}\nHTML={html_path}\nExcel={excel_path}\nReport={reports["markdown"]}'
    )


if __name__ == '__main__':
    main()
