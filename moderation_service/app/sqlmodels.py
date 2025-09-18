from __future__ import annotations

from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class ReportRow(SQLModel, table=True):
    id: str = Field(primary_key=True)
    content_id: str
    content_text: str
    reason: str
    reporter_id: Optional[str] = None
    status: str = Field(index=True)
    admin_notes_json: str = Field(default="[]")
    escalation_level: int = 0
    sla_minutes: Optional[int] = None
    escalated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)



class AppealRow(SQLModel, table=True):
    id: str = Field(primary_key=True)
    report_id: str = Field(index=True)
    user_id: str = Field(index=True)
    reason: str
    status: str = Field(default="new", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class RoleRow(SQLModel, table=True):
    id: str = Field(primary_key=True)
    user_id: str = Field(index=True)
    role: str = Field(index=True, description="e.g., admin|moderator|reviewer")
    scope: Optional[str] = Field(default=None, description="optional scope like ward:Ward 48 or global")
    created_by: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
