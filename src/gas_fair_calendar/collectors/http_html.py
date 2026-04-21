from __future__ import annotations

from ..models import EventRecord
from .base import BaseCollector


class GenericHTMLCollector(BaseCollector):
    def collect(self) -> list[EventRecord]:
        # Productized skeleton: source-specific collectors can override this later.
        return []
