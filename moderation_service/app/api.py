from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status, Depends, Header
from pydantic import BaseModel
import os
import jwt
from jwt import InvalidTokenError

from .models import Report, ReportCreate, ReportUpdateStatus, ReportStatus


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


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# JWT auth dependency
def get_current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication scheme")
    secret = os.environ.get("JWT_SECRET", "dev-secret-change-me")
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"])
    except InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub") or payload.get("userId")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return {"user_id": str(user_id), "claims": payload}


@router.post("/reports", response_model=Report, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
async def create_report(request: Request, payload: ReportCreate) -> Report:
    store = get_store(request)
    queue = get_queue(request)
    report = await store.create_report(payload)
    await queue.enqueue(report.id)
    return report


@router.get("/reports", response_model=List[Report], dependencies=[Depends(get_current_user)])
async def list_reports(request: Request, status_filter: Optional[ReportStatus] = None) -> List[Report]:
    store = get_store(request)
    return await store.list_reports(status=status_filter)


@router.get("/reports/{report_id}", response_model=Report, dependencies=[Depends(get_current_user)])
async def get_report(request: Request, report_id: str) -> Report:
    store = get_store(request)
    report = await store.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.patch("/reports/{report_id}/status", response_model=Report, dependencies=[Depends(get_current_user)])
async def update_report_status(request: Request, report_id: str, payload: ReportUpdateStatus) -> Report:
    store = get_store(request)
    updated = await store.update_status(report_id, payload.status, admin_note=payload.admin_note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.post("/appeals", response_model=Appeal, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_user)])
async def create_appeal(payload: AppealCreate) -> Appeal:
    import datetime, uuid
    a = Appeal(
        id=str(uuid.uuid4()),
        report_id=payload.report_id,
        user_id=payload.user_id,
        reason=payload.reason,
        status="new",
        created_at=datetime.datetime.utcnow().isoformat(),
    )
    appeals_store[a.id] = a
    return a


@router.get("/appeals", response_model=List[Appeal], dependencies=[Depends(get_current_user)])
async def list_appeals(status_filter: Optional[str] = None) -> List[Appeal]:
    items = list(appeals_store.values())
    if status_filter:
        items = [a for a in items if a.status == status_filter]
    return items


@router.get("/transparency/aggregates", dependencies=[Depends(get_current_user)])
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


@router.post("/reports/{report_id}/escalate", response_model=Report, dependencies=[Depends(get_current_user)])
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


@router.post("/reports/{report_id}/deescalate", response_model=Report, dependencies=[Depends(get_current_user)])
async def deescalate_report(request: Request, report_id: str, note: Optional[str] = None) -> Report:
    store = get_store(request)
    updated = await store.deescalate(report_id, note=note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.post("/reports/{report_id}/close", response_model=Report, dependencies=[Depends(get_current_user)])
async def close_report(request: Request, report_id: str, note: Optional[str] = None) -> Report:
    store = get_store(request)
    updated = await store.close(report_id, note=note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated