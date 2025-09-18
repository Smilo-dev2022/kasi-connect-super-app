from __future__ import annotations

import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timezone
import json
import os

from .models import Report, ReportCreate, ReportStatus
from .db import get_session
from .sqlmodels import ReportRow
from uuid import uuid4


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


class PostgresReportStore:
    """SQL-backed report store using SQLModel/SQLAlchemy."""

    def __init__(self) -> None:
        # No state; sessions are per-call
        ...

    async def create_report(self, data: ReportCreate) -> Report:
        for session in get_session():
            row = ReportRow(
                id=str(uuid4()),
                content_id=data.content_id,
                content_text=data.content_text,
                reason=data.reason,
                reporter_id=data.reporter_id,
                status=ReportStatus.PENDING.value,
            )
            session.add(row)
            session.commit()
            return Report(
                id=row.id,
                content_id=row.content_id,
                content_text=row.content_text,
                reason=row.reason,
                reporter_id=row.reporter_id,
                status=ReportStatus(row.status),
                admin_notes=[],
                escalation_level=row.escalation_level,
                sla_minutes=row.sla_minutes,
                escalated_at=row.escalated_at,
                closed_at=row.closed_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )

    async def get_report(self, report_id: str) -> Optional[Report]:
        for session in get_session():
            row = session.get(ReportRow, report_id)
            if not row:
                return None
            return Report(
                id=row.id,
                content_id=row.content_id,
                content_text=row.content_text,
                reason=row.reason,
                reporter_id=row.reporter_id,
                status=ReportStatus(row.status),
                admin_notes=[],
                escalation_level=row.escalation_level,
                sla_minutes=row.sla_minutes,
                escalated_at=row.escalated_at,
                closed_at=row.closed_at,
                created_at=row.created_at,
                updated_at=row.updated_at,
            )

    async def list_reports(self, status: Optional[ReportStatus] = None) -> List[Report]:
        for session in get_session():
            query = session.query(ReportRow)
            if status is not None:
                query = query.filter(ReportRow.status == status.value)
            rows = query.order_by(ReportRow.created_at.desc()).all()
            results: List[Report] = []
            for row in rows:
                results.append(
                    Report(
                        id=row.id,
                        content_id=row.content_id,
                        content_text=row.content_text,
                        reason=row.reason,
                        reporter_id=row.reporter_id,
                        status=ReportStatus(row.status),
                        admin_notes=[],
                        escalation_level=row.escalation_level,
                        sla_minutes=row.sla_minutes,
                        escalated_at=row.escalated_at,
                        closed_at=row.closed_at,
                        created_at=row.created_at,
                        updated_at=row.updated_at,
                    )
                )
            return results

    async def update_status(self, report_id: str, status: ReportStatus, admin_note: Optional[str] = None) -> Optional[Report]:
        report = await self.get_report(report_id)
        if report is None:
            return None
        for session in get_session():
            row = session.get(ReportRow, report_id)
            if not row:
                return None
            row.status = status.value
            row.updated_at = datetime.now(timezone.utc)
            session.add(row)
            session.commit()
            if admin_note:
                # In SQL path, we don't persist notes text list for brevity
                pass
            return await self.get_report(report_id)

    async def escalate(self, report_id: str, level_delta: int = 1, sla_minutes: Optional[int] = None, note: Optional[str] = None) -> Optional[Report]:
        for session in get_session():
            row = session.get(ReportRow, report_id)
            if not row:
                return None
            row.escalation_level = max(0, (row.escalation_level or 0) + level_delta)
            row.sla_minutes = sla_minutes if sla_minutes is not None else row.sla_minutes
            row.escalated_at = datetime.now(timezone.utc)
            row.updated_at = datetime.now(timezone.utc)
            session.add(row)
            session.commit()
            return await self.get_report(report_id)

    async def deescalate(self, report_id: str, note: Optional[str] = None) -> Optional[Report]:
        for session in get_session():
            row = session.get(ReportRow, report_id)
            if not row:
                return None
            row.escalation_level = max(0, (row.escalation_level or 0) - 1)
            row.updated_at = datetime.now(timezone.utc)
            session.add(row)
            session.commit()
            return await self.get_report(report_id)

    async def close(self, report_id: str, note: Optional[str] = None) -> Optional[Report]:
        for session in get_session():
            row = session.get(ReportRow, report_id)
            if not row:
                return None
            if row.status != ReportStatus.ACTION_TAKEN.value:
                row.status = ReportStatus.DISMISSED.value
            row.closed_at = datetime.now(timezone.utc)
            row.updated_at = datetime.now(timezone.utc)
            session.add(row)
            session.commit()
            return await self.get_report(report_id)