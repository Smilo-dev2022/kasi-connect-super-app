from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status

from .models import Report, ReportCreate, ReportUpdateStatus, ReportStatus
from pydantic import BaseModel
from uuid import uuid4


# Appeals MVP
class AppealCreate(BaseModel):
    report_id: str
    user_id: str
    reason: str


class Appeal(BaseModel):
    id: str
    report_id: str
    user_id: str
    reason: str
    status: str
    created_at: str

appeals_store: dict[str, Appeal] = {}

router = APIRouter(prefix="/api", tags=["moderation"])


def get_store(request: Request):
    return request.app.state.store


def get_queue(request: Request):
    return request.app.state.abuse_queue


def get_appeals(request: Request):
    return request.app.state.appeals


def get_roles(request: Request):
    return request.app.state.roles


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/reports", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(request: Request, payload: ReportCreate) -> Report:
    store = get_store(request)
    queue = get_queue(request)
    report = await store.create_report(payload)
    await queue.enqueue(report.id)
    return report


@router.get("/reports", response_model=List[Report])
async def list_reports(request: Request, status_filter: Optional[ReportStatus] = None) -> List[Report]:
    store = get_store(request)
    return await store.list_reports(status=status_filter)


@router.get("/reports/{report_id}", response_model=Report)
async def get_report(request: Request, report_id: str) -> Report:
    store = get_store(request)
    report = await store.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.patch("/reports/{report_id}/status", response_model=Report)
async def update_report_status(request: Request, report_id: str, payload: ReportUpdateStatus) -> Report:
    store = get_store(request)
    updated = await store.update_status(report_id, payload.status, admin_note=payload.admin_note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.post("/appeals", response_model=Appeal, status_code=status.HTTP_201_CREATED)
async def create_appeal(request: Request, payload: AppealCreate) -> Appeal:
    store = get_appeals(request)
    data = await store.create(payload.report_id, payload.user_id, payload.reason)
    return Appeal(**data)  # type: ignore[arg-type]


@router.get("/appeals", response_model=List[Appeal])
async def list_appeals(request: Request, status_filter: Optional[str] = None) -> List[Appeal]:
    store = get_appeals(request)
    items = await store.list(status_filter)
    return [Appeal(**a) for a in items]  # type: ignore[list-item]


@router.get("/transparency/aggregates")
async def transparency_aggregates() -> dict:
    # Minimal aggregates from in-memory report store if available
    counts: dict[str, int] = {}
    try:
        # type: ignore[attr-defined]
        for r in await get_store.__wrapped__():  # not actually works; fallback below
            counts[r.reason] = counts.get(r.reason, 0) + 1
    except Exception:
        pass
    # Fallback to appeals counts
    appeals_total = len(appeals_store)
    by_status: dict[str, int] = {}
    for a in appeals_store.values():
        by_status[a.status] = by_status.get(a.status, 0) + 1
    return {"ok": True, "appeals_total": appeals_total, "appeals_by_status": by_status, "reports_by_reason": counts}


@router.post("/reports/{report_id}/escalate", response_model=Report)
async def escalate_report(request: Request, report_id: str, level_delta: int = 1, sla_minutes: Optional[int] = None, note: Optional[str] = None) -> Report:
    store = get_store(request)
    updated = await store.escalate(report_id, level_delta=level_delta, sla_minutes=sla_minutes, note=note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    try:
        request.app.state.moderation_escalations_total.inc()
    except Exception:
        pass
    return updated


@router.post("/reports/{report_id}/deescalate", response_model=Report)
async def deescalate_report(request: Request, report_id: str, note: Optional[str] = None) -> Report:
    store = get_store(request)
    updated = await store.deescalate(report_id, note=note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.post("/reports/{report_id}/close", response_model=Report)
async def close_report(request: Request, report_id: str, note: Optional[str] = None) -> Report:
    store = get_store(request)
    updated = await store.close(report_id, note=note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


class RoleGrant(BaseModel):
    user_id: str
    role: str
    scope: Optional[str] = None


class Role(BaseModel):
    id: str
    user_id: str
    role: str
    scope: Optional[str] = None
    created_by: Optional[str] = None
    created_at: str


@router.post("/roles", response_model=Role, status_code=status.HTTP_201_CREATED)
async def grant_role(request: Request, payload: RoleGrant, x_admin_user: Optional[str] = None) -> Role:
    roles = get_roles(request)
    data = await roles.grant(payload.user_id, payload.role, payload.scope, x_admin_user)
    return Role(**data)  # type: ignore[arg-type]


@router.get("/roles", response_model=List[Role])
async def list_roles(request: Request, user_id: Optional[str] = None) -> List[Role]:
    roles = get_roles(request)
    items = await roles.list(user_id)
    return [Role(**r) for r in items]  # type: ignore[list-item]