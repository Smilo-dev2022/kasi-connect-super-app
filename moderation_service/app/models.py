from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional, List
from uuid import uuid4

from pydantic import BaseModel, Field


class ReportStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    IN_REVIEW = "in_review"
    ACTION_TAKEN = "action_taken"
    DISMISSED = "dismissed"


class ReportCreate(BaseModel):
    content_id: str = Field(..., description="Unique identifier for the content under review")
    content_text: str = Field(..., description="Snapshot of the content text at report time")
    reason: str = Field(..., description="Reason provided by reporter")
    reporter_id: Optional[str] = Field(None, description="Optional identifier of the reporter")


class ReportUpdateStatus(BaseModel):
    status: ReportStatus
    admin_note: Optional[str] = None


class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    content_id: str
    content_text: str
    reason: str
    reporter_id: Optional[str] = None
    status: ReportStatus = Field(default=ReportStatus.PENDING)
    admin_notes: List[str] = Field(default_factory=list)
    escalation_level: Optional[int] = Field(default=None, description="Escalation level index")
    sla_minutes: Optional[int] = Field(default=None)
    escalated_at: Optional[datetime] = Field(default=None)
    closed_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def add_admin_note(self, note: str) -> None:
        self.admin_notes.append(note)
        self.updated_at = datetime.now(timezone.utc)