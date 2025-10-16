from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..db import get_session
from ..models import Block, Report, ReportBase

router = APIRouter(prefix="/api", tags=["Safety"])  # mounted at /api


@router.post("/blocks/{userId}", response_model=Block, status_code=201)
def block_user(*, session: Session = Depends(get_session), userId: str) -> Block:
    # current user stub
    me = "system"
    block = session.get(Block, (me, userId))
    if block:
        return block
    block = Block(blocker_id=me, blocked_user_id=userId, created_at=datetime.utcnow())
    session.add(block)
    session.commit()
    session.refresh(block)
    return block


@router.delete("/blocks/{userId}", status_code=204)
def unblock_user(*, session: Session = Depends(get_session), userId: str) -> None:
    me = "system"
    block = session.get(Block, (me, userId))
    if block:
        session.delete(block)
        session.commit()


@router.post("/reports", response_model=Report, status_code=201)
def report_content(*, session: Session = Depends(get_session), data: ReportBase) -> Report:
    now = datetime.utcnow()
    rep = Report(
        id=f"rep_{int(now.timestamp()*1000)}",
        reporter_id=data.reporter_id,
        target_type=data.target_type,
        target_id=data.target_id,
        reason_code=data.reason_code,
        notes=data.notes,
        status=data.status or "open",
        created_at=now,
    )
    session.add(rep)
    session.commit()
    session.refresh(rep)
    return rep
