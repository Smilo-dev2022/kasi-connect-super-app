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


# ----------------------
# Wallet V2
# ----------------------


class WalletRequestBase(SQLModel):
    group_id: str = Field(index=True, description="Group identifier")
    requester_id: str = Field(index=True, description="User who requested payment")
    amount_cents: int = Field(ge=1, description="Amount in cents")
    currency: str = Field(default="ZAR", description="ISO currency code")
    status: str = Field(
        default="requested",
        description="requested|accepted|paid|canceled|expired",
        index=True,
    )
    expires_at: Optional[datetime] = Field(default=None, description="Expiry time")


class WalletRequest(WalletRequestBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    accepted_by: Optional[str] = Field(default=None, index=True)
    paid_by: Optional[str] = Field(default=None, index=True)
    canceled_by: Optional[str] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class WalletRequestCreate(SQLModel):
    group_id: str
    requester_id: str
    amount_cents: int
    currency: Optional[str] = None
    expires_at: Optional[datetime] = None


class WalletRequestRead(WalletRequestBase):
    id: int
    accepted_by: Optional[str]
    paid_by: Optional[str]
    canceled_by: Optional[str]
    created_at: datetime
    updated_at: datetime


class GroupLedger(SQLModel, table=True):
    group_id: str = Field(primary_key=True)
    member_id: str = Field(primary_key=True)
    balance_cents: int = Field(default=0, description="Member balance in cents (can be negative)")
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class LedgerEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: str = Field(index=True)
    member_id: str = Field(index=True)
    amount_cents: int
    reason: str = Field(default="payment")
    related_request_id: Optional[int] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

