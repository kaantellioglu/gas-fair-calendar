from pathlib import Path
import json
from datetime import datetime, timezone
from fastapi import FastAPI
from pydantic import BaseModel

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
app = FastAPI(title="Gas Fair Calendar API", version="1.0.0")

class SourceIn(BaseModel):
    name: str
    url: str
    sourceType: str = "custom"
    region: str = "global"
    category: str = "ng"
    checkFrequency: str = "weekly"

class ScanJobIn(BaseModel):
    mode: str = "delta"
    selectedSources: list[str] = []
    region: str = "all"
    category: str = "all"
    notes: str = ""


def _read_json(name):
    path = DATA / name
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(name, payload):
    path = DATA / name
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

@app.get('/api/health')
def health():
    return {'ok': True, 'time': datetime.now(timezone.utc).isoformat()}

@app.get('/api/events')
def events():
    return _read_json('events_frontend.json')

@app.get('/api/sources')
def sources():
    return _read_json('sources.json')

@app.post('/api/sources')
def create_source(payload: SourceIn):
    items = _read_json('sources.json')
    item = payload.model_dump()
    item['key'] = f"user-{len(items)+1}"
    item['enabled'] = True
    item['tier'] = 3
    item['discovery'] = True
    item['usePlaywright'] = False
    items.append(item)
    _write_json('sources.json', items)
    return item

@app.get('/api/scan-jobs')
def scan_jobs():
    return _read_json('scan_jobs.json')

@app.post('/api/scan-jobs')
def create_scan_job(payload: ScanJobIn):
    items = _read_json('scan_jobs.json')
    job = payload.model_dump()
    job['id'] = f"job-{len(items)+1}"
    job['status'] = 'queued'
    job['createdAt'] = datetime.now(timezone.utc).isoformat()
    items.insert(0, job)
    _write_json('scan_jobs.json', items)
    return job
