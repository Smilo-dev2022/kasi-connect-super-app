from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..db import get_session
from ..models import RSVP, RSVPCreate, RSVPRead, RSVPUpdate


router = APIRouter()


@router.post("/events/{event_id}/rsvps", response_model=RSVPRead, status_code=201)
def create_rsvp_for_event(*, session: Session = Depends(get_session), event_id: int, data: RSVPCreate) -> RSVPRead:
    if data.event_id != event_id:
        # Allow payload to omit event_id when using nested route
        data.event_id = event_id
    rsvp = RSVP.from_orm(data)
    now = datetime.utcnow()
    rsvp.created_at = now
    rsvp.updated_at = now
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    return rsvp


@router.get("/events/{event_id}/rsvps", response_model=List[RSVPRead])
def list_rsvps_for_event(*, session: Session = Depends(get_session), event_id: int) -> List[RSVPRead]:
    statement = select(RSVP).where(RSVP.event_id == event_id)
    return session.exec(statement).all()


@router.post("/rsvps", response_model=RSVPRead, status_code=201)
def create_rsvp(*, session: Session = Depends(get_session), data: RSVPCreate) -> RSVPRead:
    rsvp = RSVP.from_orm(data)
    now = datetime.utcnow()
    rsvp.created_at = now
    rsvp.updated_at = now
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    return rsvp


@router.get("/rsvps/{rsvp_id}", response_model=RSVPRead)
def get_rsvp(*, session: Session = Depends(get_session), rsvp_id: int) -> RSVPRead:
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    return rsvp


@router.patch("/rsvps/{rsvp_id}", response_model=RSVPRead)
def update_rsvp(*, session: Session = Depends(get_session), rsvp_id: int, data: RSVPUpdate) -> RSVPRead:
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rsvp, key, value)
    rsvp.updated_at = datetime.utcnow()
    session.add(rsvp)
    session.commit()
    session.refresh(rsvp)
    return rsvp


@router.delete("/rsvps/{rsvp_id}", status_code=204)
def delete_rsvp(*, session: Session = Depends(get_session), rsvp_id: int) -> None:
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp:
        raise HTTPException(status_code=404, detail="RSVP not found")
    session.delete(rsvp)
    session.commit()
    return None

