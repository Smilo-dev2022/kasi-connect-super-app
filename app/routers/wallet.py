from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse
from sqlmodel import Session, select

from ..db import get_session
from ..models import (
    WalletTransaction,
    WalletTransactionCreate,
    WalletTransactionRead,
)


router = APIRouter(prefix="/wallet")


def _ensure_transition(current: str, target: str) -> None:
    allowed: dict[str, set[str]] = {
        "requested": {"accepted", "canceled", "expired"},
        "accepted": {"paid", "canceled"},
        "paid": set(),
        "canceled": set(),
        "expired": set(),
    }
    if target not in allowed.get(current, set()):
        raise HTTPException(status_code=400, detail=f"invalid_transition: {current} -> {target}")


@router.get("/transactions", response_model=List[WalletTransactionRead])
def list_transactions(*, session: Session = Depends(get_session)) -> List[WalletTransactionRead]:
    statement = select(WalletTransaction).order_by(WalletTransaction.created_at.desc())
    return session.exec(statement).all()


@router.post("/transactions", response_model=WalletTransactionRead, status_code=201)
def create_transaction(
    *, session: Session = Depends(get_session), data: WalletTransactionCreate
) -> WalletTransactionRead:
    tx = WalletTransaction.from_orm(data)
    now = datetime.utcnow()
    tx.created_at = now
    tx.updated_at = now
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx


def _get_tx_or_404(session: Session, tx_id: int) -> WalletTransaction:
    tx = session.get(WalletTransaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="transaction_not_found")
    return tx


@router.post("/transactions/{tx_id}/accept", response_model=WalletTransactionRead)
def accept_transaction(*, session: Session = Depends(get_session), tx_id: int) -> WalletTransactionRead:
    tx = _get_tx_or_404(session, tx_id)
    _ensure_transition(tx.status, "accepted")
    tx.status = "accepted"
    tx.updated_at = datetime.utcnow()
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx


@router.post("/transactions/{tx_id}/cancel", response_model=WalletTransactionRead)
def cancel_transaction(*, session: Session = Depends(get_session), tx_id: int) -> WalletTransactionRead:
    tx = _get_tx_or_404(session, tx_id)
    # allow cancel from requested or accepted
    target = "canceled"
    _ensure_transition(tx.status, target if tx.status != "requested" else target)
    if tx.status not in {"requested", "accepted"}:
        raise HTTPException(status_code=400, detail=f"invalid_transition: {tx.status} -> canceled")
    tx.status = target
    tx.updated_at = datetime.utcnow()
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx


@router.post("/transactions/{tx_id}/mark-paid", response_model=WalletTransactionRead)
def mark_paid_transaction(*, session: Session = Depends(get_session), tx_id: int) -> WalletTransactionRead:
    tx = _get_tx_or_404(session, tx_id)
    _ensure_transition(tx.status, "paid")
    tx.status = "paid"
    tx.updated_at = datetime.utcnow()
    session.add(tx)
    session.commit()
    session.refresh(tx)
    return tx


@router.get("/transactions.csv")
def export_transactions_csv(*, session: Session = Depends(get_session)) -> PlainTextResponse:
    rows: List[WalletTransaction] = session.exec(select(WalletTransaction).order_by(WalletTransaction.created_at.asc())).all()
    header = "id,amount_cents,currency,description,counterparty,status,created_at,updated_at"
    lines = [header]
    for r in rows:
        description = (r.description or "").replace(",", " ")
        counterparty = (r.counterparty or "").replace(",", " ")
        lines.append(
            ",".join(
                [
                    str(r.id),
                    str(r.amount_cents),
                    r.currency,
                    description,
                    counterparty,
                    r.status,
                    r.created_at.isoformat(),
                    r.updated_at.isoformat(),
                ]
            )
        )
    csv_text = "\n".join(lines) + "\n"
    return PlainTextResponse(content=csv_text, media_type="text/csv")

