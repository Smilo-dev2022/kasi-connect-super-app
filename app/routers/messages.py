from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..db import get_session
from ..models import Message, MessageCreate, Group

router = APIRouter(prefix="/api", tags=["Messages"])  # mounted at /api


@router.get("/groups/{id}/messages")
def list_messages(
    *,
    session: Session = Depends(get_session),
    id: str,
    before: Optional[str] = Query(default=None),
    after: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
):
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    stmt = select(Message).where(Message.group_id == id).order_by(Message.created_at.desc())
    # naive cursor by message id timestamp prefix if our ids are time-based
    if before:
        # fallback: just filter by id lexicographically
        stmt = stmt.where(Message.id < before)
    if after:
        stmt = stmt.where(Message.id > after)
    items: List[Message] = session.exec(stmt.limit(limit)).all()

    # DTO format similar to spec
    result_items = [m.dict() for m in items]
    next_cursor = items[-1].id if items else None
    prev_cursor = items[0].id if items else None
    return {"items": result_items, "next_cursor": next_cursor, "prev_cursor": prev_cursor}


@router.post("/groups/{id}/messages", response_model=Message, status_code=201)
def send_message(*, session: Session = Depends(get_session), id: str, data: MessageCreate) -> Message:
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    now = datetime.utcnow()
    msg = Message(
        id=f"msg_{int(now.timestamp()*1000)}",
        group_id=id,
        sender_id="system",  # TODO: replace with auth user
        type=data.type,
        text=data.text,
        media_id=data.media_id,
        created_at=now,
    )
    session.add(msg)
    session.commit()
    session.refresh(msg)
    return msg
