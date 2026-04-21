from gas_fair_calendar.frontend import build_frontend_json
from gas_fair_calendar.pipeline import run_auto_update
from gas_fair_calendar.seed import seed_master_from_frontend
from gas_fair_calendar.settings import DATA_DIR, BUILD_DIR


def test_seed_master_from_frontend():
    events = seed_master_from_frontend()
    assert len(events) >= 20
    assert any(e.name == 'Pipeline & Gas Expo 2026' for e in events)


def test_auto_update_builds_outputs():
    result = run_auto_update(seed_if_empty=True)
    assert result['event_count'] >= 20
    assert (DATA_DIR / 'events_frontend.json').exists()
    assert (BUILD_DIR / 'GAZ-FUAR_TAKVIMI-OTOMATIK.html').exists()
    assert (BUILD_DIR / 'events_master.xlsx').exists()
    build_frontend_json()
