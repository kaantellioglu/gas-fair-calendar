from __future__ import annotations

from ..models import EventRecord
from .base import BaseCollector


class PlaywrightCollector(BaseCollector):
    def collect(self) -> list[EventRecord]:
        # Productized skeleton: source-specific Playwright parsers can override this later.
        return []
