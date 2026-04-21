from datetime import date
from src.gas_fair_calendar.models import EventRecord
from src.gas_fair_calendar.validation import validate_event


def test_validate_good_event():
    event = EventRecord(
        id="evt-test-2026",
        name="Test Event",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 1, 2),
        city="Istanbul",
        country="Türkiye",
        region="eu",
        category="ng",
        source_type="official_site",
        status="confirmed",
        confidence_score=0.9,
    )
    result = validate_event(event)
    assert result.valid is True
