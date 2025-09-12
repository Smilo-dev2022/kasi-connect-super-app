from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..db import get_session
from ..models import Event, EventCreate, EventRead, EventUpdate


router = APIRouter()


@router.get("/", response_model=List[EventRead])
def list_events(
    *,
    session: Session = Depends(get_session),
    q: Optional[str] = Query(default=None, description="Search in title/description"),
) -> List[EventRead]:
    statement = select(Event)
    if q:
        like = f"%{q}%"
        statement = statement.where((Event.title.ilike(like)) | (Event.description.ilike(like)))
    statement = statement.order_by(Event.start_time.asc())
    return session.exec(statement).all()


@router.post("/", response_model=EventRead, status_code=201)
def create_event(*, session: Session = Depends(get_session), data: EventCreate) -> EventRead:
    event = Event.from_orm(data)
    now = datetime.utcnow()
    event.created_at = now
    event.updated_at = now
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventRead)
def get_event(*, session: Session = Depends(get_session), event_id: int) -> EventRead:
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.patch("/{event_id}", response_model=EventRead)
def update_event(
    *, session: Session = Depends(get_session), event_id: int, data: EventUpdate
) -> EventRead:
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)
    event.updated_at = datetime.utcnow()
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
def delete_event(*, session: Session = Depends(get_session), event_id: int) -> None:
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    session.delete(event)
    session.commit()
    return None


@router.post("/seed", response_model=List[EventRead], include_in_schema=False)
def seed_events(*, session: Session = Depends(get_session)) -> List[EventRead]:
    if session.exec(select(Event)).first():
        return session.exec(select(Event)).all()
    now = datetime.utcnow()
    upcoming = [
        Event(title="Team Offsite", description="Q4 planning", start_time=now + timedelta(days=7), end_time=now + timedelta(days=7, hours=8), location="HQ"),
        Event(title="Hackathon", description="24h build", start_time=now + timedelta(days=14), end_time=now + timedelta(days=14, hours=12), location="Lab"),
    ]
    for e in upcoming:
        e.created_at = now
        e.updated_at = now
        session.add(e)
    session.commit()
    return session.exec(select(Event)).all()

