from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class EventBase(SQLModel):
    title: str = Field(index=True)
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime


class Event(EventBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    rsvps: List[RSVP] = Relationship(back_populates="event")  # type: ignore[name-defined]


class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime


class EventUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


class RSVPBase(SQLModel):
    name: str
    email: Optional[str] = Field(default=None, index=True)
    status: str = Field(default="going", description="going|maybe|declined")


class RSVP(RSVPBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    event: Optional[Event] = Relationship(back_populates="rsvps")  # type: ignore[name-defined]


class RSVPCreate(RSVPBase):
    event_id: Optional[int]


class RSVPRead(RSVPBase):
    id: int
    event_id: int
    created_at: datetime
    updated_at: datetime


class RSVPUpdate(SQLModel):
    name: Optional[str] = None
    email: Optional[str] = None
    status: Optional[str] = None

