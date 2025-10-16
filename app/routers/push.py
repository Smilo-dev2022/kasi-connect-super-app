from __future__ import annotations

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from ..db import get_session
from ..models import Device

router = APIRouter(prefix="/api", tags=["Push"])  # mounted at /api


@router.post("/devices", response_model=Device, status_code=201)
def register_device(*, session: Session = Depends(get_session), platform: str, token: str, user_id: str = "system") -> Device:
    if platform not in ("ios", "android", "web"):
        raise HTTPException(status_code=400, detail="invalid_platform")
    # reuse existing if same user+token
    existing = session.exec(
        Device.select().where(Device.user_id == user_id).where(Device.token == token)  # type: ignore[attr-defined]
    ).first()
    now = datetime.utcnow()
    if existing:
        existing.platform = platform
        existing.last_seen_at = now
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    device = Device(id=f"dev_{int(now.timestamp()*1000)}", user_id=user_id, platform=platform, token=token, created_at=now)
    session.add(device)
    session.commit()
    session.refresh(device)
    return device


@router.delete("/devices/{id}", status_code=204)
def unregister_device(*, session: Session = Depends(get_session), id: str) -> None:
    dev = session.get(Device, id)
    if dev:
        session.delete(dev)
        session.commit()
