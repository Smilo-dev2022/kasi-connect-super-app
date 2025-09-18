from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from .models import Report, ReportCreate, ReportUpdateStatus, ReportStatus
from .db import get_session
from .sqlmodels import AppealRow, ModerationRoleRow


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
async def create_appeal(payload: AppealCreate) -> Appeal:
    from uuid import uuid4
    from datetime import datetime
    appeal_id = str(uuid4())
    for session in get_session():
        row = AppealRow(
            id=appeal_id,
            report_id=payload.report_id,
            user_id=payload.user_id,
            reason=payload.reason,
            status="new",
            created_at=datetime.utcnow(),
        )
        session.add(row)
        session.commit()
        return Appeal(
            id=row.id,
            report_id=row.report_id,
            user_id=row.user_id,
            reason=row.reason,
            status=row.status,
            created_at=row.created_at.isoformat(),
        )


@router.get("/appeals", response_model=List[Appeal])
async def list_appeals(status_filter: Optional[str] = None) -> List[Appeal]:
    results: List[Appeal] = []
    for session in get_session():
        query = session.query(AppealRow)
        if status_filter:
            query = query.filter(AppealRow.status == status_filter)
        rows = query.order_by(AppealRow.created_at.desc()).all()
        for row in rows:
            results.append(
                Appeal(
                    id=row.id,
                    report_id=row.report_id,
                    user_id=row.user_id,
                    reason=row.reason,
                    status=row.status,
                    created_at=row.created_at.isoformat(),
                )
            )
        return results


@router.get("/transparency/aggregates")
async def transparency_aggregates() -> dict:
    # Simple aggregates from DB: appeals by status, total, roles counts
    from sqlalchemy import func
    data: dict = {"ok": True}
    for session in get_session():
        # Appeals totals
        total = session.query(func.count(AppealRow.id)).scalar() or 0
        data["appeals_total"] = int(total)
        by_status = (
            session.query(AppealRow.status, func.count(AppealRow.id))
            .group_by(AppealRow.status)
            .all()
        )
        data["appeals_by_status"] = {status: int(count) for status, count in by_status}
        # Roles counts
        roles = (
            session.query(ModerationRoleRow.role, func.count(ModerationRoleRow.id))
            .group_by(ModerationRoleRow.role)
            .all()
        )
        data["roles"] = {role: int(count) for role, count in roles}
        return data


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


# Simple RBAC scaffolding
class RoleAssignBody(BaseModel):
    user_id: str
    role: str


@router.get("/roles")
async def list_roles() -> List[dict]:
    results: List[dict] = []
    for session in get_session():
        rows = (
            session.query(ModerationRoleRow)
            .order_by(ModerationRoleRow.created_at.desc())
            .all()
        )
        for row in rows:
            results.append({"id": row.id, "user_id": row.user_id, "role": row.role, "created_at": row.created_at.isoformat()})
        return results


@router.post("/roles")
async def assign_role(payload: RoleAssignBody) -> dict:
    from uuid import uuid4
    from datetime import datetime
    for session in get_session():
        row = ModerationRoleRow(id=str(uuid4()), user_id=payload.user_id, role=payload.role, created_at=datetime.utcnow())
        session.add(row)
        session.commit()
        return {"ok": True, "id": row.id}


@router.delete("/roles/{role_id}")
async def delete_role(role_id: str) -> dict:
    for session in get_session():
        row = session.get(ModerationRoleRow, role_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
        session.delete(row)
        session.commit()
        return {"ok": True}