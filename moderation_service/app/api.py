from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status

from .models import Report, ReportCreate, ReportUpdateStatus, ReportStatus

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