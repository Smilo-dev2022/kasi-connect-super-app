from __future__ import annotations

import asyncio
from typing import Dict, List, Optional
import os
import asyncpg

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


class PostgresReportStore:
    def __init__(self, dsn: Optional[str] = None) -> None:
        self._dsn = dsn or os.getenv("MOD_DB_URL", "postgresql://kasilink:kasilink@localhost:5432/kasilink")
        self._pool: Optional[asyncpg.Pool] = None

    async def _pool_get(self) -> asyncpg.Pool:
        if self._pool is None:
            self._pool = await asyncpg.create_pool(self._dsn, max_size=10)
        return self._pool

    async def create_schema(self) -> None:
        pool = await self._pool_get()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                create table if not exists mod_reports (
                  id uuid primary key,
                  content_id text not null,
                  content_text text not null,
                  reason text not null,
                  reporter_id text null,
                  status text not null default 'pending',
                  admin_notes jsonb not null default '[]',
                  created_at timestamptz not null default now(),
                  updated_at timestamptz not null default now()
                );
                """
            )

    async def create_report(self, data: "ReportCreate") -> "Report":
        from .models import Report
        pool = await self._pool_get()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "insert into mod_reports(id, content_id, content_text, reason, reporter_id) values (gen_random_uuid(), $1, $2, $3, $4) returning id, content_id, content_text, reason, reporter_id, status, admin_notes, created_at, updated_at",
                data.content_id,
                data.content_text,
                data.reason,
                data.reporter_id,
            )
        return Report(
            id=str(row["id"]),
            content_id=row["content_id"],
            content_text=row["content_text"],
            reason=row["reason"],
            reporter_id=row["reporter_id"],
            status=row["status"],
            admin_notes=list(row["admin_notes"] or []),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    async def get_report(self, report_id: str) -> Optional["Report"]:
        from .models import Report
        pool = await self._pool_get()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "select id, content_id, content_text, reason, reporter_id, status, admin_notes, created_at, updated_at from mod_reports where id = $1",
                report_id,
            )
            if not row:
                return None
            return Report(
                id=str(row["id"]),
                content_id=row["content_id"],
                content_text=row["content_text"],
                reason=row["reason"],
                reporter_id=row["reporter_id"],
                status=row["status"],
                admin_notes=list(row["admin_notes"] or []),
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )

    async def list_reports(self, status: Optional["ReportStatus"] = None) -> List["Report"]:
        from .models import Report
        pool = await self._pool_get()
        async with pool.acquire() as conn:
            if status is None:
                rows = await conn.fetch("select id, content_id, content_text, reason, reporter_id, status, admin_notes, created_at, updated_at from mod_reports order by created_at desc")
            else:
                rows = await conn.fetch(
                    "select id, content_id, content_text, reason, reporter_id, status, admin_notes, created_at, updated_at from mod_reports where status=$1 order by created_at desc",
                    status.value,
                )
        output: List[Report] = []
        for row in rows:
            output.append(
                Report(
                    id=str(row["id"]),
                    content_id=row["content_id"],
                    content_text=row["content_text"],
                    reason=row["reason"],
                    reporter_id=row["reporter_id"],
                    status=row["status"],
                    admin_notes=list(row["admin_notes"] or []),
                    created_at=row["created_at"],
                    updated_at=row["updated_at"],
                )
            )
        return output

    async def update_status(self, report_id: str, status: "ReportStatus", admin_note: Optional[str] = None) -> Optional["Report"]:
        pool = await self._pool_get()
        async with pool.acquire() as conn:
            if admin_note:
                await conn.execute(
                    "update mod_reports set status=$2, admin_notes = coalesce(admin_notes, '[]'::jsonb) || to_jsonb($3::text), updated_at=now() where id=$1",
                    report_id,
                    status.value,
                    admin_note,
                )
            else:
                await conn.execute(
                    "update mod_reports set status=$2, updated_at=now() where id=$1",
                    report_id,
                    status.value,
                )
        return await self.get_report(report_id)

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