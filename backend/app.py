from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI

from gas_fair_calendar.io_json import load_json, save_json
from gas_fair_calendar.models import ScanJob, SourceConfig
from gas_fair_calendar.pipeline import build_scan_job, run_auto_update
from gas_fair_calendar.settings import DATA_DIR
from gas_fair_calendar.utils import now_utc, slugify

app = FastAPI(title="Gas Fair Calendar API", version="2.0.0")


@app.get("/api/health")
def health():
    return {"ok": True, "time": now_utc().isoformat()}


@app.get("/api/events")
def events():
    return load_json(DATA_DIR / "events_frontend.json", [])


@app.get("/api/sources")
def sources():
    return load_json(DATA_DIR / "sources.json", [])


@app.post("/api/sources")
def create_source(payload: dict):
    items = load_json(DATA_DIR / "sources.json", [])
    if not payload.get("key"):
        payload["key"] = f"user-{slugify(payload.get('name', 'source'))}"
    payload.setdefault("enabled", True)
    payload.setdefault("tier", 3)
    payload.setdefault("discovery", True)
    payload.setdefault("usePlaywright", False)
    source = SourceConfig.model_validate(payload)
    items.append(source.model_dump(mode="json", by_alias=True))
    save_json(DATA_DIR / "sources.json", items)
    return source.model_dump(mode="json", by_alias=True)


@app.get("/api/scan-jobs")
def scan_jobs():
    return load_json(DATA_DIR / "scan_jobs.json", [])


@app.post("/api/scan-jobs")
def create_scan_job(payload: dict):
    items = load_json(DATA_DIR / "scan_jobs.json", [])
    job = build_scan_job(mode=payload.get("mode", "full"))
    if payload.get("source_keys"):
        job.source_keys = payload["source_keys"]
    if payload.get("regions"):
        job.regions = payload["regions"]
    if payload.get("categories"):
        job.categories = payload["categories"]
    items.insert(0, job.model_dump(mode="json"))
    save_json(DATA_DIR / "scan_jobs.json", items)
    return job.model_dump(mode="json")


@app.post("/api/scan-run")
def scan_run():
    return run_auto_update(seed_if_empty=True)
