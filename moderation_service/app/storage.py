from __future__ import annotations

import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timezone
import json
import os

from .models import Report, ReportCreate, ReportStatus


class InMemoryReportStore:
    """Thread-safe in-memory report store suitable for development and tests."""

    def __init__(self) -> None:
        self._reports: Dict[str, Report] = {}
        self._lock = asyncio.Lock()
        self._audit_log_path = os.environ.get("AUDIT_LOG_PATH", "/workspace/moderation_service/audit.log")

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

    async def escalate(self, report_id: str, level_delta: int = 1, sla_minutes: Optional[int] = None, note: Optional[str] = None) -> Optional[Report]:
        async with self._lock:
            report = self._reports.get(report_id)
            if report is None:
                return None
            report.escalation_level = max(0, report.escalation_level + level_delta)
            report.sla_minutes = sla_minutes if sla_minutes is not None else report.sla_minutes
            report.escalated_at = datetime.now(timezone.utc)
            report.updated_at = datetime.now(timezone.utc)
            if note:
                report.add_admin_note(note)
            await self._append_audit("escalate", report)
            return report

    async def deescalate(self, report_id: str, note: Optional[str] = None) -> Optional[Report]:
        async with self._lock:
            report = self._reports.get(report_id)
            if report is None:
                return None
            report.escalation_level = max(0, report.escalation_level - 1)
            report.updated_at = datetime.now(timezone.utc)
            if note:
                report.add_admin_note(note)
            await self._append_audit("deescalate", report)
            return report

    async def close(self, report_id: str, note: Optional[str] = None) -> Optional[Report]:
        async with self._lock:
            report = self._reports.get(report_id)
            if report is None:
                return None
            report.status = ReportStatus.DISMISSED if report.status != ReportStatus.ACTION_TAKEN else report.status
            report.closed_at = datetime.now(timezone.utc)
            report.updated_at = datetime.now(timezone.utc)
            if note:
                report.add_admin_note(note)
            await self._append_audit("close", report)
            return report

    async def _append_audit(self, action: str, report: Report) -> None:
        entry = {
            "time": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "report_id": report.id,
            "status": report.status.value,
            "escalation_level": report.escalation_level,
            "sla_minutes": report.sla_minutes,
        }
        try:
            with open(self._audit_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry) + "\n")
        except Exception:
            # best-effort audit; ignore errors in dev
            pass