from __future__ import annotations

from datetime import datetime, date
from typing import Literal, Optional, List
from pydantic import BaseModel, Field, HttpUrl, field_validator

Region = Literal["eu", "gcc", "turkic", "asia", "global"]
Category = Literal["lng", "lpg", "dist", "ng", "equip", "boiler", "gcc", "asia"]
Status = Literal["confirmed", "needs_review", "candidate", "deprecated", "cancelled"]
SourceType = Literal["official_site", "organizer", "association", "venue", "secondary_backup"]


class ChangeEntry(BaseModel):
    timestamp: datetime
    field: str
    old: Optional[str] = None
    new: Optional[str] = None
    source_url: Optional[str] = None


class EventRecord(BaseModel):
    id: str
    name: str
    short_name: Optional[str] = None
    start_date: date
    end_date: date
    city: str
    country: str
    region: Region
    category: Category
    venue: Optional[str] = ""
    organizer: Optional[str] = ""
    website: Optional[str] = None
    ticket_info: Optional[str] = ""
    description: Optional[str] = ""
    contact: Optional[str] = ""
    source_url: Optional[str] = None
    source_type: SourceType = "official_site"
    status: Status = "candidate"
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    last_checked_at: Optional[datetime] = None
    last_changed_at: Optional[datetime] = None
    change_log: List[ChangeEntry] = Field(default_factory=list)

    @field_validator("end_date")
    @classmethod
    def validate_date_order(cls, value: date, info):
        start_date = info.data.get("start_date")
        if start_date and value < start_date:
            raise ValueError("end_date cannot be before start_date")
        return value


class SourceConfig(BaseModel):
    key: str
    enabled: bool = True
    tier: int = 2
    source_type: SourceType
    region: Region
    category: Category | str
    discovery: bool = False
    use_playwright: bool = False
    url: str
    list_urls: list[str] = Field(default_factory=list)
    check_frequency: str = "weekly"
    selectors: dict = Field(default_factory=dict)
