from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status
import os
import asyncio
from .repos import get_pool, ModerationRepos

from .models import Report, ReportCreate, ReportUpdateStatus, ReportStatus

router = APIRouter(prefix="/api", tags=["moderation"])


def get_store(request: Request):
    return request.app.state.store


def get_queue(request: Request):
    return request.app.state.abuse_queue


async def get_repos() -> ModerationRepos:
    pool = await get_pool()
    return ModerationRepos(pool)


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/reports", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(request: Request, payload: ReportCreate) -> Report:
    if os.getenv("MOD_USE_DB", "").lower() == "true":
        repos = await get_repos()
        row = await repos.reports.create(payload.reporter_id, target_type="message", target_id=None, reason=payload.reason)
        await repos.queue.enqueue(row["id"])
        return Report(
            id=str(row["id"]),
            content_id=payload.content_id,
            content_text=payload.content_text,
            reason=row["reason"],
            reporter_id=row["reporter_id"],
        )
    store = get_store(request)
    queue = get_queue(request)
    report = await store.create_report(payload)
    await queue.enqueue(report.id)
    return report


@router.get("/reports", response_model=List[Report])
async def list_reports(request: Request, status_filter: Optional[ReportStatus] = None, limit: int = 50, cursor: Optional[str] = None) -> List[Report]:
    if os.getenv("MOD_USE_DB", "").lower() == "true":
        repos = await get_repos()
        rows, _ = await repos.reports.list(status_filter.value if status_filter else None, limit=limit, cursor=cursor)
        out: List[Report] = []
        for r in rows:
            out.append(
                Report(
                    id=str(r["id"]),
                    content_id="",
                    content_text="",
                    reason=r["reason"],
                    reporter_id=r["reporter_id"],
                    status=ReportStatus(r["status"]),
                    created_at=r["created_at"],
                )
            )
        return out
    store = get_store(request)
    return await store.list_reports(status=status_filter)


@router.get("/reports/list")
async def list_reports_paginated(status_filter: Optional[ReportStatus] = None, limit: int = 50, cursor: Optional[str] = None) -> dict:
    if os.getenv("MOD_USE_DB", "").lower() == "true":
        repos = await get_repos()
        rows, next_cursor = await repos.reports.list(status_filter.value if status_filter else None, limit=limit, cursor=cursor)
        items = [
            {
                "id": str(r["id"]),
                "reason": r["reason"],
                "reporter_id": r["reporter_id"],
                "status": r["status"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
            }
            for r in rows
        ]
        return {"items": items, "next_cursor": next_cursor}
    # Fallback to in-memory
    return {"items": [], "next_cursor": None}


@router.get("/reports/{report_id}", response_model=Report)
async def get_report(request: Request, report_id: str) -> Report:
    store = get_store(request)
    report = await store.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.patch("/reports/{report_id}/status", response_model=Report)
async def update_report_status(request: Request, report_id: str, payload: ReportUpdateStatus) -> Report:
    if os.getenv("MOD_USE_DB", "").lower() == "true":
        repos = await get_repos()
        row = await repos.reports.update_status(report_id, payload.status.value)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
        return Report(
            id=str(row["id"]),
            content_id="",
            content_text="",
            reason=row["reason"],
            reporter_id=row["reporter_id"],
            status=ReportStatus(row["status"]),
            created_at=row["created_at"],
        )
    store = get_store(request)
    updated = await store.update_status(report_id, payload.status, admin_note=payload.admin_note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated

@router.post("/reports/{report_id}/action")
async def record_action(report_id: str, request: Request) -> dict:
    if os.getenv("MOD_USE_DB", "").lower() != "true":
        return {"ok": False}
    body = await request.json()
    actor_id = body.get("actor_id")
    action = body.get("action")
    notes = body.get("notes")
    repos = await get_repos()
    row = await repos.actions.record_action(report_id, actor_id, action, notes)

    return {"ok": True, "id": str(row["id"]) }


@router.get("/queue")
async def list_queue() -> dict:
    if os.getenv("MOD_USE_DB", "").lower() != "true":
        return {"items": []}
    repos = await get_repos()
    items = await repos.queue.list_open()
    return {"items": items}


@router.post("/queue/enqueue")
async def enqueue_report(body: dict) -> dict:
    if os.getenv("MOD_USE_DB", "").lower() != "true":
        return {"ok": False}
    report_id = body.get("report_id")
    repos = await get_repos()
    row = await repos.queue.enqueue(report_id)
    return {"ok": True, "id": str(row["id"]) }


@router.post("/queue/claim")
async def claim_queue(body: dict) -> dict:
    if os.getenv("MOD_USE_DB", "").lower() != "true":
        return {"ok": False}
    assigned_to = body.get("assigned_to")
    repos = await get_repos()
    row = await repos.queue.claim(assigned_to)
    return {"ok": True, "item": row}


@router.post("/queue/release")
async def release_queue(body: dict) -> dict:
    if os.getenv("MOD_USE_DB", "").lower() != "true":
        return {"ok": False}
    qid = body.get("id")
    repos = await get_repos()
    await repos.queue.release(qid)
    return {"ok": True}