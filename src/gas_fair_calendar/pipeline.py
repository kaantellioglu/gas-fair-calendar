from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from .build_html import build_html
from .dedupe import find_duplicates
from .export_excel import export_excel
from .frontend import build_frontend_json
from .io_json import load_events, load_jobs, load_sources, save_events, save_jobs
from .merge import merge_event
from .models import EventRecord, ScanJob
from .reporting import write_run_report
from .seed import seed_master_from_frontend
from .settings import BACKUP_DIR, DATA_DIR
from .utils import now_utc
from .validation import validate_many


def backup_file(path: Path) -> Path | None:
    if not path.exists():
        return None
    ts = now_utc().strftime("%Y%m%d-%H%M%S")
    backup_path = BACKUP_DIR / f"{path.stem}-{ts}{path.suffix}"
    shutil.copy2(path, backup_path)
    return backup_path


def build_scan_job(mode: str = "full") -> ScanJob:
    sources = load_sources(DATA_DIR / "sources.json")
    active = [s for s in sources if s.enabled]
    return ScanJob(
        job_id=str(uuid.uuid4()),
        job_name=f"auto_update_{now_utc().strftime('%Y%m%d_%H%M%S')}",
        mode=mode,
        source_keys=[s.key for s in active],
        regions=sorted(set(s.region for s in active)),
        categories=sorted(set(str(s.category) for s in active)),
        options={"only_new": False, "update_existing": True, "seed_if_empty": True},
        created_at=now_utc(),
        status="queued",
        notes=["Job created automatically by Python pipeline."],
    )


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
    merged = sorted(index.values(), key=lambda e: (e.start_date.isoformat() if e.start_date else "9999-12-31", e.name))
    return merged, added, updated


def run_auto_update(*, seed_if_empty: bool = True) -> dict:
    master_path = DATA_DIR / "events_master.json"
    jobs_path = DATA_DIR / "scan_jobs.json"

    backup_file(master_path)
    backup_file(DATA_DIR / "events_frontend.json")

    jobs = load_jobs(jobs_path)
    job = build_scan_job()
    job.started_at = now_utc()
    job.status = "running"
    jobs.append(job)
    save_jobs(jobs_path, jobs)

    master = load_events(master_path)
    if seed_if_empty and not master:
        master = seed_master_from_frontend()
        job.notes.append("Seeded events_master.json from events_frontend.json because master was empty.")

    # Productized default behavior: keep validated seed data and merge future collector output later.
    merged, added, updated = merge_all(master, [])

    issues = validate_many(merged)
    duplicates = find_duplicates(merged)

    if len(merged) < 5 and master:
        raise RuntimeError("Safety stop: merged dataset too small; refusing to overwrite master data.")

    save_events(master_path, merged)
    save_events(DATA_DIR / "candidates.json", [e for e in merged if e.status in {"candidate", "needs_review"}])
    build_frontend_json()
    build_html()
    export_excel()

    job.completed_at = now_utc()
    job.status = "completed"
    job.results = {
        "event_count": len(merged),
        "issues": len(issues),
        "duplicates": len(duplicates),
        "added": added,
        "updated": updated,
    }
    save_jobs(jobs_path, jobs)

    write_run_report(
        issues=[f"{issue.event_id}: {issue.message}" for issue in issues],
        added=added,
        updated=updated,
        duplicates=duplicates,
        sources_scanned=len(job.source_keys),
        job_name=job.job_name,
    )

    return job.results
