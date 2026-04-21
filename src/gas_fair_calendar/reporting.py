from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from .io_json import load_events
from .settings import DATA_DIR, OUTPUT_DIR


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def write_run_report(issues: list[str], added: int, updated: int, duplicates: list[tuple[str, str]], backup_path: Path | None = None, incoming_count: int = 0) -> dict[str, Path]:
    events = load_events(DATA_DIR / 'events_master.json')
    by_region = Counter(e.region for e in events)
    by_category = Counter(e.category for e in events)
    by_status = Counter(e.status for e in events)

    payload = {
        'generated_at': _now_iso(),
        'total_events': len(events),
        'incoming_count': incoming_count,
        'added': added,
        'updated': updated,
        'backup_path': str(backup_path) if backup_path else None,
        'potential_duplicates': duplicates,
        'issues': issues,
        'distribution': {
            'region': dict(sorted(by_region.items())),
            'category': dict(sorted(by_category.items())),
            'status': dict(sorted(by_status.items())),
        },
    }

    json_path = OUTPUT_DIR / 'run_report.json'
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

    lines = [
        '# Run Report', '',
        f"Generated at: {payload['generated_at']}",
        f"Total events: {payload['total_events']}",
        f"Incoming records: {incoming_count}",
        f'Added: {added}',
        f'Updated: {updated}',
        f"Backup: {payload['backup_path'] or '-'}",
        f'Potential duplicates: {len(duplicates)}', '',
        '## Distribution by region',
    ]
    for key, value in sorted(by_region.items()):
        lines.append(f'- {key}: {value}')
    lines.append('')
    lines.append('## Distribution by category')
    for key, value in sorted(by_category.items()):
        lines.append(f'- {key}: {value}')
    lines.append('')
    lines.append('## Distribution by status')
    for key, value in sorted(by_status.items()):
        lines.append(f'- {key}: {value}')
    lines.append('')
    lines.append('## Issues')
    if issues:
        lines.extend(f'- {item}' for item in issues)
    else:
        lines.append('- None')

    md_path = OUTPUT_DIR / 'run_report.md'
    md_path.write_text('\n'.join(lines), encoding='utf-8')
    return {'json': json_path, 'markdown': md_path}
