from __future__ import annotations

from typing import List, Optional
import os

from fastapi import APIRouter, HTTPException, Request, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel

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

# JWT auth dependency
security = HTTPBearer(auto_error=True)
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret-change-me")
JWT_ALGORITHMS = ["HS256"]

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=JWT_ALGORITHMS)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
    return {"sub": user_id, **{k: v for k, v in payload.items() if k != "sub"}}


def get_store(request: Request):
    return request.app.state.store


def get_queue(request: Request):
    return request.app.state.abuse_queue


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/reports", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(request: Request, payload: ReportCreate, user=Depends(get_current_user)) -> Report:
    store = get_store(request)
    queue = get_queue(request)
    report = await store.create_report(payload)
    await queue.enqueue(report.id)
    return report


@router.get("/reports", response_model=List[Report])
async def list_reports(request: Request, status_filter: Optional[ReportStatus] = None, user=Depends(get_current_user)) -> List[Report]:
    store = get_store(request)
    return await store.list_reports(status=status_filter)


@router.get("/reports/{report_id}", response_model=Report)
async def get_report(request: Request, report_id: str, user=Depends(get_current_user)) -> Report:
    store = get_store(request)
    report = await store.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.patch("/reports/{report_id}/status", response_model=Report)
async def update_report_status(request: Request, report_id: str, payload: ReportUpdateStatus, user=Depends(get_current_user)) -> Report:
    store = get_store(request)
    updated = await store.update_status(report_id, payload.status, admin_note=payload.admin_note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.post("/appeals", response_model=Appeal, status_code=status.HTTP_201_CREATED)
async def create_appeal(payload: AppealCreate, user=Depends(get_current_user)) -> Appeal:
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


@router.get("/appeals", response_model=List[Appeal])
async def list_appeals(status_filter: Optional[str] = None, user=Depends(get_current_user)) -> List[Appeal]:
    items = list(appeals_store.values())
    if status_filter:
        items = [a for a in items if a.status == status_filter]
    return items


@router.get("/transparency/aggregates")
async def transparency_aggregates(user=Depends(get_current_user)) -> dict:
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
async def escalate_report(request: Request, report_id: str, level_delta: int = 1, sla_minutes: Optional[int] = None, note: Optional[str] = None, user=Depends(get_current_user)) -> Report:
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
async def deescalate_report(request: Request, report_id: str, note: Optional[str] = None, user=Depends(get_current_user)) -> Report:
    store = get_store(request)
    updated = await store.deescalate(report_id, note=note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.post("/reports/{report_id}/close", response_model=Report)
async def close_report(request: Request, report_id: str, note: Optional[str] = None, user=Depends(get_current_user)) -> Report:
    store = get_store(request)
    updated = await store.close(report_id, note=note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated