from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

Region = Literal["eu", "gcc", "turkic", "asia", "global"]
Category = Literal["lng", "lpg", "dist", "ng", "equip", "boiler", "gcc", "asia"]
Status = Literal["confirmed", "needs_review", "candidate", "deprecated", "cancelled", "seeded"]
SourceType = Literal[
    "official_site",
    "organizer",
    "association",
    "venue",
    "secondary_backup",
    "user_added",
    "seed_html",
    "publisher",
    "custom",
]


class ChangeEntry(BaseModel):
    timestamp: datetime
    field: str
    old: Optional[str] = None
    new: Optional[str] = None
    source_url: Optional[str] = None


class EventRecord(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    name: str
    short_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    city: str = ""
    country: str = ""
    region: Region = "global"
    category: Category = "ng"
    venue: str = ""
    organizer: str = ""
    website: Optional[str] = None
    ticket_info: str = ""
    description: str = ""
    contact: str = ""
    scale: str = ""
    source_url: Optional[str] = None
    source_type: SourceType = "official_site"
    status: Status = "candidate"
    confidence_score: float = Field(default=0.5, ge=0.0, le=1.0)
    last_checked_at: Optional[datetime] = None
    last_changed_at: Optional[datetime] = None
    change_log: list[ChangeEntry] = Field(default_factory=list)

    @field_validator("start_date", "end_date", mode="before")
    @classmethod
    def empty_dates_to_none(cls, value: Any):
        if value in ("", None):
            return None
        return value

    @field_validator("end_date")
    @classmethod
    def validate_date_order(cls, value: Optional[date], info):
        start_date = info.data.get("start_date")
        if value and start_date and value < start_date:
            raise ValueError("end_date cannot be before start_date")
        return value


class SourceConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    key: str
    name: str
    url: str
    source_type: SourceType = Field(default="official_site", alias="sourceType")
    region: Region = "global"
    category: str = "ng"
    check_frequency: str = Field(default="weekly", alias="checkFrequency")
    tier: int = 2
    use_playwright: bool = Field(default=False, alias="usePlaywright")
    discovery: bool = False
    enabled: bool = True
    selectors: dict[str, Any] = Field(default_factory=dict)
    list_urls: list[str] = Field(default_factory=list, alias="listUrls")


class ScanJob(BaseModel):
    job_id: str
    job_name: str
    mode: str = "full"
    source_keys: list[str] = Field(default_factory=list)
    regions: list[str] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    options: dict[str, Any] = Field(default_factory=dict)
    status: str = "queued"
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: list[str] = Field(default_factory=list)
    results: dict[str, Any] = Field(default_factory=dict)
