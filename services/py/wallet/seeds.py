from datetime import datetime, timedelta

from sqlmodel import Session, select

from .models import Event


def seed_initial_data(session: Session) -> None:
    if session.exec(select(Event)).first():
        return
    now = datetime.utcnow()
    events = [
        Event(
            title="Team Offsite",
            description="Q4 planning",
            start_time=now + timedelta(days=7),
            end_time=now + timedelta(days=7, hours=8),
            location="HQ",
            created_at=now,
            updated_at=now,
        ),
        Event(
            title="Hackathon",
            description="24h build",
            start_time=now + timedelta(days=14),
            end_time=now + timedelta(days=14, hours=12),
            location="Lab",
            created_at=now,
            updated_at=now,
        ),
    ]
    for e in events:
        session.add(e)
    session.commit()

