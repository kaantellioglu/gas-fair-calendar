from __future__ import annotations

from dataclasses import dataclass

from .models import EventRecord


@dataclass
class ValidationIssue:
    event_id: str
    message: str


REQUIRED_TEXT_FIELDS = ["name", "city", "country", "region", "category"]


def validate_event(event: EventRecord) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for field in REQUIRED_TEXT_FIELDS:
        if not getattr(event, field, None):
            issues.append(ValidationIssue(event_id=event.id, message=f"missing {field}"))
    if event.start_date and event.end_date and event.end_date < event.start_date:
        issues.append(ValidationIssue(event_id=event.id, message="end_date before start_date"))
    if event.website and not str(event.website).startswith(("http://", "https://")):
        issues.append(ValidationIssue(event_id=event.id, message="website is not a valid URL"))
    if event.confidence_score < 0.0 or event.confidence_score > 1.0:
        issues.append(ValidationIssue(event_id=event.id, message="confidence_score out of range"))
    return issues


def validate_many(events: list[EventRecord]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    for event in events:
        issues.extend(validate_event(event))
    return issues
