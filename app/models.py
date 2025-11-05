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


# ----------------------
# Week 2: Groups, Messages, Media, Safety, Push
# ----------------------


class GroupBase(SQLModel):
    name: str
    photo_url: Optional[str] = None
    is_safety_room: bool = Field(default=False)
    created_by: str


class Group(GroupBase, table=True):
    __tablename__ = "groups"
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    max_members: int = Field(default=256)


class GroupCreate(SQLModel):
    name: str
    photo_url: Optional[str] = None
    is_safety_room: Optional[bool] = None


class GroupUpdate(SQLModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None


class GroupMember(SQLModel, table=True):
    __tablename__ = "group_members"
    group_id: str = Field(primary_key=True)
    user_id: str = Field(primary_key=True)
    role: str = Field(default="member", description="owner|admin|member")
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: Optional[datetime] = None
    is_muted: bool = Field(default=False)


class MessageBase(SQLModel):
    group_id: str = Field(index=True)
    sender_id: str = Field(index=True)
    type: str = Field(description="text|image|video|audio|file|system")
    text: Optional[str] = None
    media_id: Optional[str] = None


class Message(MessageBase, table=True):
    __tablename__ = "messages"
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    deleted_at: Optional[datetime] = None


class MessageCreate(SQLModel):
    type: str
    text: Optional[str] = None
    media_id: Optional[str] = None


class MediaBase(SQLModel):
    kind: str = Field(description="image|video|audio|file")
    original_url: str
    sizes: Optional[str] = Field(default=None, description="JSON string for sizes map")
    thumb_url: Optional[str] = None
    meta: Optional[str] = Field(default=None, description="JSON string for meta: mime, size, etc.")
    status: str = Field(default="pending", description="pending|ready|failed")


class Media(MediaBase, table=True):
    __tablename__ = "media"
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DeviceBase(SQLModel):
    user_id: str = Field(index=True)
    platform: str = Field(description="ios|android|web")
    token: str
    last_seen_at: Optional[datetime] = None


class Device(DeviceBase, table=True):
    __tablename__ = "devices"
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    __table_args__ = ({"sqlite_autoincrement": False},)


class Block(SQLModel, table=True):
    __tablename__ = "blocks"
    blocker_id: str = Field(primary_key=True)
    blocked_user_id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    reason: Optional[str] = None


class ReportBase(SQLModel):
    reporter_id: str = Field(index=True)
    target_type: str = Field(description="message|user|group")
    target_id: str
    reason_code: str
    notes: Optional[str] = None
    status: str = Field(default="open", description="open|triaged|closed")


class Report(ReportBase, table=True):
    __tablename__ = "reports"
    id: str = Field(primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

