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


class ModerationActionType(str, Enum):
    WARN = "warn"
    MUTE = "mute"
    BAN = "ban"
    DELETE = "delete"
    HIDE = "hide"
    RESTORE = "restore"
    ESCALATE = "escalate"


class AppealStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    DENIED = "denied"


class UserRole(str, Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class ReportCreate(BaseModel):
    content_id: str = Field(..., description="Unique identifier for the content under review")
    content_text: str = Field(..., description="Snapshot of the content text at report time")
    reason: str = Field(..., description="Reason provided by reporter")
    reporter_id: Optional[str] = Field(None, description="Optional identifier of the reporter")


class ReportUpdateStatus(BaseModel):
    status: ReportStatus
    admin_note: Optional[str] = None


class ModerationActionCreate(BaseModel):
    target_type: str = Field(..., description="Type of target (message, user, group)")
    target_id: str = Field(..., description="ID of the target")
    action_type: ModerationActionType
    reason: str
    duration_hours: Optional[int] = None
    moderator_id: str


class AppealCreate(BaseModel):
    moderation_action_id: str
    appellant_id: str
    reason: str


class AppealReview(BaseModel):
    status: AppealStatus
    review_notes: Optional[str] = None


class RoleAssignment(BaseModel):
    user_id: str
    role: UserRole
    granted_by: str
    expires_at: Optional[datetime] = None


class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    content_id: str
    content_text: str
    reason: str
    reporter_id: Optional[str] = None
    status: ReportStatus = Field(default=ReportStatus.PENDING)
    admin_notes: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    def add_admin_note(self, note: str) -> None:
        self.admin_notes.append(note)
        self.updated_at = datetime.now(timezone.utc)


class ModerationAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    target_type: str
    target_id: str
    action_type: ModerationActionType
    moderator_id: str
    reason: str
    duration_hours: Optional[int] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    is_active: bool = True


class Appeal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    moderation_action_id: str
    appellant_id: str
    reason: str
    status: AppealStatus = Field(default=AppealStatus.PENDING)
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None


class UserRoleAssignment(BaseModel):
    user_id: str
    role: UserRole
    granted_by: str
    granted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    is_active: bool = True