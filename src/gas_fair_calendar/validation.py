from __future__ import annotations

from dataclasses import dataclass, field
from datetime import timedelta
from typing import Iterable
from .models import EventRecord


@dataclass
class ValidationIssue:
    event_id: str
    severity: str
    message: str


@dataclass
class ValidationResult:
    valid: bool
    issues: list[ValidationIssue] = field(default_factory=list)


ALLOWED_YEARS = {2026, 2027}


def validate_event(event: EventRecord) -> ValidationResult:
    issues: list[ValidationIssue] = []

    if event.start_date.year not in ALLOWED_YEARS:
        issues.append(ValidationIssue(event.id, "warning", f"Unexpected start year: {event.start_date.year}"))
    if event.end_date < event.start_date:
        issues.append(ValidationIssue(event.id, "error", "end_date before start_date"))
    if not event.website and event.source_type == "official_site":
        issues.append(ValidationIssue(event.id, "warning", "Missing official website"))
    if event.confidence_score < 0.5:
        issues.append(ValidationIssue(event.id, "warning", "Low confidence score"))
    if not event.city or not event.country:
        issues.append(ValidationIssue(event.id, "error", "Missing city or country"))

    return ValidationResult(valid=not any(i.severity == "error" for i in issues), issues=issues)


def validate_many(events: Iterable[EventRecord]) -> list[ValidationIssue]:
    all_issues: list[ValidationIssue] = []
    for event in events:
        all_issues.extend(validate_event(event).issues)
    return all_issues
