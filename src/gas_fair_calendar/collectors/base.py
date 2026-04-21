from __future__ import annotations

from abc import ABC, abstractmethod
from ..models import EventRecord, SourceConfig


class BaseCollector(ABC):
    def __init__(self, source: SourceConfig):
        self.source = source

    @abstractmethod
    def collect(self) -> list[EventRecord]:
        raise NotImplementedError
