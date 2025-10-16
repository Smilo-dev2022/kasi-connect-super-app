from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlmodel import Session, select

from ..db import get_session
from ..models import Event


router = APIRouter()


def _send_reminder(event: Event) -> None:
    # Placeholder side effect; in real life, integrate with email/SMS provider
    print(f"[reminder] Event '{event.title}' at {event.start_time.isoformat()}")


@router.post("/reminders/queue-upcoming", status_code=202)
def queue_upcoming_event_reminders(
    *,
    session: Session = Depends(get_session),
    background: BackgroundTasks,
) -> dict:
    now = datetime.utcnow()
    soon = now + timedelta(hours=24)
    events: List[Event] = session.exec(
        select(Event).where(Event.start_time >= now, Event.start_time <= soon)
    ).all()
    for event in events:
        background.add_task(_send_reminder, event)
    return {"queued": len(events)}

