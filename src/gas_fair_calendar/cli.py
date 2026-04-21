from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from .build_html import build_html
from .export_excel import export_excel
from .io_json import load_events
from .reporting import write_run_report
from .seed_from_html import seed_from_html
from .settings import DATA_DIR, OUTPUT_DIR
from .update_pipeline import main as run_update
from .validation import validate_many
from .dedupe import find_duplicates


def cmd_update(_: argparse.Namespace) -> int:
    run_update()
    return 0


def cmd_build_html(_: argparse.Namespace) -> int:
    path = build_html()
    print(path)
    return 0


def cmd_export_excel(_: argparse.Namespace) -> int:
    path = export_excel()
    print(path)
    return 0


def cmd_validate(_: argparse.Namespace) -> int:
    events = load_events(DATA_DIR / 'events_master.json')
    issues = validate_many(events)
    duplicates = find_duplicates(events)
    reports = write_run_report(
        issues=[f'{issue.event_id}: {issue.message}' for issue in issues],
        added=0,
        updated=0,
        duplicates=duplicates,
    )
    print(json.dumps({
        'issues': len(issues),
        'duplicates': len(duplicates),
        'report_markdown': str(reports['markdown']),
        'report_json': str(reports['json']),
    }, ensure_ascii=False, indent=2))
    return 1 if any(issue.severity == 'error' for issue in issues) else 0


def cmd_stats(_: argparse.Namespace) -> int:
    events = load_events(DATA_DIR / 'events_master.json')
    payload = {
        'total': len(events),
        'by_region': dict(sorted(Counter(e.region for e in events).items())),
        'by_category': dict(sorted(Counter(e.category for e in events).items())),
        'by_status': dict(sorted(Counter(e.status for e in events).items())),
        'html': str(OUTPUT_DIR / 'GAZ-FUAR_TAKVIMI-OTOMATIK.html'),
        'excel': str(OUTPUT_DIR / 'events_master.xlsx'),
    }
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


def cmd_seed_html(args: argparse.Namespace) -> int:
    added, updated, backup = seed_from_html(Path(args.html_file).expanduser().resolve())
    print(json.dumps({'added': added, 'updated': updated, 'backup': str(backup) if backup else None}, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog='gas-fair-calendar', description='Gas fair calendar automation CLI')
    sub = parser.add_subparsers(dest='command', required=True)

    for name, func, help_text in [
        ('update', cmd_update, 'Run full update pipeline'),
        ('build-html', cmd_build_html, 'Build HTML dashboard only'),
        ('export-excel', cmd_export_excel, 'Export Excel only'),
        ('validate', cmd_validate, 'Validate data and write reports'),
        ('stats', cmd_stats, 'Show data statistics'),
    ]:
        p = sub.add_parser(name, help=help_text)
        p.set_defaults(func=func)

    seed = sub.add_parser('seed-html', help='Import fairs from legacy HTML EV array and merge into master data')
    seed.add_argument('html_file', help='Path to the legacy HTML file')
    seed.set_defaults(func=cmd_seed_html)
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == '__main__':
    raise SystemExit(main())
