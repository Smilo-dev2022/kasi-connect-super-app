from __future__ import annotations

import os
from typing import Any, List, Optional, Tuple

import asyncpg


async def get_pool() -> asyncpg.Pool:
    dsn = os.getenv("DATABASE_URL") or os.getenv("MOD_DB_URL") or "postgresql://kasilink:kasilink@localhost:5432/kasilink"
    return await asyncpg.create_pool(dsn, max_size=10)


class ReportsRepo:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def create(self, reporter_id: Optional[str], target_type: str, target_id: Optional[str], reason: str) -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                insert into reports(id, reporter_id, target_type, target_id, reason)
                values (gen_random_uuid(), $1, $2, $3, $4)
                returning id, reporter_id, target_type, target_id, reason, status, created_at
                """,
                reporter_id,
                target_type,
                target_id,
                reason,
            )
            return dict(row)

    async def get(self, report_id: str) -> Optional[dict]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "select id, reporter_id, target_type, target_id, reason, status, created_at from reports where id=$1",
                report_id,
            )
            return dict(row) if row else None

    async def list(self, status: Optional[str], limit: int = 50, cursor: Optional[str] = None) -> Tuple[List[dict], Optional[str]]:
        async with self.pool.acquire() as conn:
            if cursor:
                q = (
                    "select id, reporter_id, target_type, target_id, reason, status, created_at from reports "
                    "where ($1::text is null or status=$1) and created_at < $2::timestamptz order by created_at desc limit $3"
                )
                rows = await conn.fetch(q, status, cursor, limit)
            else:
                q = (
                    "select id, reporter_id, target_type, target_id, reason, status, created_at from reports "
                    "where ($1::text is null or status=$1) order by created_at desc limit $2"
                )
                rows = await conn.fetch(q, status, limit)
            items = [dict(r) for r in rows]
            next_cur = items[-1]["created_at"].isoformat() if len(items) == limit else None
            return items, next_cur

    async def update_status(self, report_id: str, status: str) -> Optional[dict]:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "update reports set status=$2 where id=$1 returning id, reporter_id, target_type, target_id, reason, status, created_at",
                report_id,
                status,
            )
            return dict(row) if row else None


class QueueRepo:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def enqueue(self, report_id: str) -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "insert into queue(id, report_id, state) values (gen_random_uuid(), $1, 'queued') returning id, report_id, assigned_to, state, created_at",
                report_id,
            )
            return dict(row)

    async def claim(self, assigned_to: str) -> Optional[dict]:
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                row = await conn.fetchrow(
                    "select id from queue where state='queued' order by created_at asc for update skip locked limit 1"
                )
                if not row:
                    return None
                qid = row["id"]
                row2 = await conn.fetchrow(
                    "update queue set assigned_to=$2, state='claimed' where id=$1 returning id, report_id, assigned_to, state, created_at",
                    qid,
                    assigned_to,
                )
                return dict(row2)

    async def release(self, queue_id: str) -> None:
        async with self.pool.acquire() as conn:
            await conn.execute("update queue set assigned_to=null, state='queued' where id=$1", queue_id)

    async def list_open(self) -> List[dict]:
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "select id, report_id, assigned_to, state, created_at from queue where state in ('queued','claimed') order by created_at asc"
            )
            return [dict(r) for r in rows]


class ActionsRepo:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.pool = pool

    async def record_action(self, report_id: str, actor_id: str, action: str, notes: Optional[str]) -> dict:
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "insert into actions(id, report_id, actor_id, action, notes) values (gen_random_uuid(), $1, $2, $3, $4) returning id, report_id, actor_id, action, notes, created_at",
                report_id,
                actor_id,
                action,
                notes,
            )
            return dict(row)


class ModerationRepos:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self.reports = ReportsRepo(pool)
        self.queue = QueueRepo(pool)
        self.actions = ActionsRepo(pool)

