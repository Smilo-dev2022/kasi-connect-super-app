from __future__ import annotations

import asyncio
from typing import Dict, List, Optional

from .models import Report, ReportCreate, ReportStatus


class InMemoryReportStore:
    """Thread-safe in-memory report store suitable for development and tests."""

    def __init__(self) -> None:
        self._reports: Dict[str, Report] = {}
        self._lock = asyncio.Lock()

    async def create_report(self, data: ReportCreate) -> Report:
        async with self._lock:
            report = Report(
                content_id=data.content_id,
                content_text=data.content_text,
                reason=data.reason,
                reporter_id=data.reporter_id,
            )
            self._reports[report.id] = report
            return report

    async def get_report(self, report_id: str) -> Optional[Report]:
        async with self._lock:
            return self._reports.get(report_id)

    async def list_reports(self, status: Optional[ReportStatus] = None) -> List[Report]:
        async with self._lock:
            values = list(self._reports.values())
            if status is None:
                return sorted(values, key=lambda r: r.created_at, reverse=True)
            return sorted([r for r in values if r.status == status], key=lambda r: r.created_at, reverse=True)

    async def update_status(self, report_id: str, status: ReportStatus, admin_note: Optional[str] = None) -> Optional[Report]:
        async with self._lock:
            report = self._reports.get(report_id)
            if report is None:
                return None
            report.status = status
            if admin_note:
                report.add_admin_note(admin_note)
            return report