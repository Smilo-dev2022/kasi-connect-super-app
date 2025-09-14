from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, SQLModel


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


# Wallet V2 models
class WalletTransactionBase(SQLModel):
    amount_cents: int = Field(description="Amount in cents")
    currency: str = Field(default="ZAR")
    description: Optional[str] = None
    counterparty: Optional[str] = Field(default=None, description="Name or identifier of the counterparty")
    status: str = Field(
        default="requested",
        description="requested|accepted|paid|canceled|expired",
        index=True,
    )
    expires_at: Optional[datetime] = Field(default=None, description="Expiration timestamp for requests")


class WalletTransaction(WalletTransactionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class WalletTransactionCreate(WalletTransactionBase):
    pass


class WalletTransactionRead(WalletTransactionBase):
    id: int
    created_at: datetime
    updated_at: datetime


class WalletTransactionUpdate(SQLModel):
    description: Optional[str] = None
    status: Optional[str] = None
    expires_at: Optional[datetime] = None


# Group ledger models
class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)


class GroupMember(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="group.id", index=True)
    member_name: str = Field(index=True)
    balance_cents: int = Field(default=0, description="Member balance in cents (positive means owed to member)")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

