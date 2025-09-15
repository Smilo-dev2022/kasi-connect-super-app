from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Event(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(index=True, unique=True)
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_at: datetime
    end_at: Optional[datetime] = None
    capacity: Optional[int] = None
    is_published: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RSVP(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")
    name: str
    email: str = Field(index=True)
    status: str = Field(default="confirmed")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Ticket(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    rsvp_id: int = Field(foreign_key="rsvp.id", index=True)
    token: str = Field(index=True, unique=True)
    issued_at: datetime = Field(default_factory=datetime.utcnow)
    checked_in_at: Optional[datetime] = None
    status: str = Field(default="valid")


class CheckIn(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ticket_id: int = Field(foreign_key="ticket.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    by_user: Optional[str] = None
    note: Optional[str] = None


class WardIngest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    ward: str = Field(index=True)
    source: Optional[str] = None
    received_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    payload: Optional[str] = None

