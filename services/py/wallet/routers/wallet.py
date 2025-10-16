from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse
from sqlmodel import Session, select

from ..db import get_session
from ..models import (
    WalletRequest,
    WalletRequestCreate,
    WalletRequestRead,
    GroupLedger,
    LedgerEntry,
)


router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.post("/requests", response_model=WalletRequestRead, status_code=201)
def create_request(*, request: Request, session: Session = Depends(get_session), data: WalletRequestCreate) -> WalletRequestRead:
    req = WalletRequest(
        group_id=data.group_id,
        requester_id=data.requester_id,
        amount_cents=data.amount_cents,
        currency=data.currency or "ZAR",
        status="requested",
        expires_at=data.expires_at,
    )
    now = datetime.utcnow()
    req.created_at = now
    req.updated_at = now
    session.add(req)
    session.commit()
    session.refresh(req)
    # metrics
    try:
        request.app.state.wallet_request_total.inc()
        request.app.state.wallet_state_change_total.inc()
    except Exception:
        pass
    return req


@router.get("/requests", response_model=List[WalletRequestRead])
def list_requests(
    *,
    session: Session = Depends(get_session),
    group_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
) -> List[WalletRequestRead]:
    stmt = select(WalletRequest)
    if group_id:
        stmt = stmt.where(WalletRequest.group_id == group_id)
    if status:
        stmt = stmt.where(WalletRequest.status == status)
    stmt = stmt.order_by(WalletRequest.created_at.desc())
    return session.exec(stmt).all()


def _ensure_not_expired(req: WalletRequest) -> None:
    if req.expires_at and req.expires_at < datetime.utcnow() and req.status == "requested":
        req.status = "expired"


@router.post("/maintenance/expire", status_code=202)
def expire_requests(*, session: Session = Depends(get_session)) -> dict:
    now = datetime.utcnow()
    # Minimal sweep: mark requested items with expires_at < now as expired
    items = session.exec(
        select(WalletRequest).where(WalletRequest.status == "requested").where(
            WalletRequest.expires_at != None  # type: ignore[comparison-overlap]
        )
    ).all()
    updated = 0
    for item in items:
        if item.expires_at and item.expires_at < now:
            item.status = "expired"
            item.updated_at = now
            session.add(item)
            updated += 1
    if updated:
        session.commit()
    return {"expired": updated}


@router.post("/requests/{request_id}/accept", response_model=WalletRequestRead)
def accept_request(
    *, request: Request, session: Session = Depends(get_session), request_id: int, actor_id: str
) -> WalletRequestRead:
    req = session.get(WalletRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    _ensure_not_expired(req)
    if req.status != "requested":
        raise HTTPException(status_code=400, detail="Invalid state transition")
    req.status = "accepted"
    req.accepted_by = actor_id
    req.updated_at = datetime.utcnow()
    session.add(req)
    session.commit()
    session.refresh(req)
    try:
        request.app.state.wallet_state_change_total.inc()
    except Exception:
        pass
    return req


@router.post("/requests/{request_id}/cancel", response_model=WalletRequestRead)
def cancel_request(
    *, request: Request, session: Session = Depends(get_session), request_id: int, actor_id: str
) -> WalletRequestRead:
    req = session.get(WalletRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    _ensure_not_expired(req)
    if req.status in ("paid", "canceled", "expired"):
        raise HTTPException(status_code=400, detail="Invalid state transition")
    req.status = "canceled"
    req.canceled_by = actor_id
    req.updated_at = datetime.utcnow()
    session.add(req)
    session.commit()
    session.refresh(req)
    try:
        request.app.state.wallet_state_change_total.inc()
    except Exception:
        pass
    return req


@router.post("/requests/{request_id}/pay", response_model=WalletRequestRead)
def mark_paid(
    *, request: Request, session: Session = Depends(get_session), request_id: int, payer_id: str
) -> WalletRequestRead:
    req = session.get(WalletRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    _ensure_not_expired(req)
    if req.status not in ("accepted", "requested"):
        raise HTTPException(status_code=400, detail="Invalid state transition")
    # If paying directly from requested, treat as accept+pay
    if req.status == "requested":
        req.accepted_by = payer_id
    req.status = "paid"
    req.paid_by = payer_id
    req.updated_at = datetime.utcnow()

    # Ledger entries: requester receives funds, payer pays out
    # Idempotency: if ledger entries for this request already exist, skip
    existing_entries = session.exec(
        select(LedgerEntry).where(LedgerEntry.related_request_id == req.id)
    ).all()
    if not existing_entries:
        _apply_ledger_delta(session, req.group_id, req.requester_id, req.amount_cents, req.id)
        _apply_ledger_delta(session, req.group_id, payer_id, -req.amount_cents, req.id)

    session.add(req)
    session.commit()
    session.refresh(req)
    try:
        request.app.state.wallet_mark_paid_total.inc()
        request.app.state.wallet_state_change_total.inc()
    except Exception:
        pass
    return req


def _apply_ledger_delta(
    session: Session, group_id: str, member_id: str, delta_cents: int, related_request_id: Optional[int]
) -> None:
    # Upsert group ledger balance
    gl = session.get(GroupLedger, (group_id, member_id))
    if gl is None:
        gl = GroupLedger(group_id=group_id, member_id=member_id, balance_cents=0)
    gl.balance_cents = (gl.balance_cents or 0) + delta_cents
    gl.updated_at = datetime.utcnow()
    session.add(gl)
    # Append ledger entry
    session.add(
        LedgerEntry(
            group_id=group_id,
            member_id=member_id,
            amount_cents=delta_cents,
            reason="wallet_request",
            related_request_id=related_request_id,
        )
    )


@router.get("/groups/{group_id}/balances")
def get_group_balances(*, session: Session = Depends(get_session), group_id: str):
    rows = session.exec(select(GroupLedger).where(GroupLedger.group_id == group_id)).all()
    return {"group_id": group_id, "balances": [row.dict() for row in rows]}


@router.get("/groups/{group_id}/ledger.csv")
def export_group_ledger_csv(*, session: Session = Depends(get_session), group_id: str):
    entries: List[LedgerEntry] = session.exec(
        select(LedgerEntry).where(LedgerEntry.group_id == group_id).order_by(LedgerEntry.created_at.asc())
    ).all()
    lines = ["id,group_id,member_id,amount_cents,reason,related_request_id,created_at"]
    for e in entries:
        lines.append(
            ",".join(
                [
                    str(e.id or ""),
                    e.group_id,
                    e.member_id,
                    str(e.amount_cents),
                    e.reason.replace(",", " "),
                    str(e.related_request_id or ""),
                    e.created_at.isoformat(),
                ]
            )
        )
    return PlainTextResponse("\n".join(lines) + "\n", media_type="text/csv")

