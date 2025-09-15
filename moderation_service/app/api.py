from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request, status

from .models import (
    Report, ReportCreate, ReportUpdateStatus, ReportStatus,
    ModerationAction, ModerationActionCreate,
    Appeal, AppealCreate, AppealReview, AppealStatus,
    UserRoleAssignment, RoleAssignment, UserRole
)

router = APIRouter(prefix="/api", tags=["moderation"])


def get_store(request: Request):
    return request.app.state.store


def get_queue(request: Request):
    return request.app.state.abuse_queue


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


# Reports endpoints
@router.post("/reports", response_model=Report, status_code=status.HTTP_201_CREATED)
async def create_report(request: Request, payload: ReportCreate) -> Report:
    store = get_store(request)
    queue = get_queue(request)
    report = await store.create_report(payload)
    await queue.enqueue(report.id)
    return report


@router.get("/reports", response_model=List[Report])
async def list_reports(request: Request, status_filter: Optional[ReportStatus] = None) -> List[Report]:
    store = get_store(request)
    return await store.list_reports(status=status_filter)


@router.get("/reports/{report_id}", response_model=Report)
async def get_report(request: Request, report_id: str) -> Report:
    store = get_store(request)
    report = await store.get_report(report_id)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return report


@router.patch("/reports/{report_id}/status", response_model=Report)
async def update_report_status(request: Request, report_id: str, payload: ReportUpdateStatus) -> Report:
    store = get_store(request)
    updated = await store.update_status(report_id, payload.status, admin_note=payload.admin_note)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


# Moderation Actions endpoints
@router.post("/moderation-actions", response_model=ModerationAction, status_code=status.HTTP_201_CREATED)
async def create_moderation_action(request: Request, payload: ModerationActionCreate) -> ModerationAction:
    store = get_store(request)
    action = await store.create_moderation_action(payload)
    return action


@router.get("/moderation-actions", response_model=List[ModerationAction])
async def list_moderation_actions(request: Request, moderator_id: Optional[str] = None) -> List[ModerationAction]:
    store = get_store(request)
    return await store.list_moderation_actions(moderator_id=moderator_id)


@router.get("/moderation-actions/{action_id}", response_model=ModerationAction)
async def get_moderation_action(request: Request, action_id: str) -> ModerationAction:
    store = get_store(request)
    action = await store.get_moderation_action(action_id)
    if action is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Moderation action not found")
    return action


# Appeals endpoints
@router.post("/appeals", response_model=Appeal, status_code=status.HTTP_201_CREATED)
async def create_appeal(request: Request, payload: AppealCreate) -> Appeal:
    store = get_store(request)
    # Verify the moderation action exists
    action = await store.get_moderation_action(payload.moderation_action_id)
    if action is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Moderation action not found")
    
    appeal = await store.create_appeal(payload)
    return appeal


@router.get("/appeals", response_model=List[Appeal])
async def list_appeals(request: Request, status_filter: Optional[AppealStatus] = None) -> List[Appeal]:
    store = get_store(request)
    return await store.list_appeals(status=status_filter)


@router.get("/appeals/{appeal_id}", response_model=Appeal)
async def get_appeal(request: Request, appeal_id: str) -> Appeal:
    store = get_store(request)
    appeal = await store.get_appeal(appeal_id)
    if appeal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appeal not found")
    return appeal


@router.patch("/appeals/{appeal_id}/review", response_model=Appeal)
async def review_appeal(request: Request, appeal_id: str, payload: AppealReview, reviewer_id: str) -> Appeal:
    store = get_store(request)
    appeal = await store.review_appeal(appeal_id, payload.status, payload.review_notes, reviewer_id)
    if appeal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appeal not found")
    return appeal


# Roles endpoints  
@router.post("/roles", response_model=UserRoleAssignment, status_code=status.HTTP_201_CREATED)
async def assign_role(request: Request, payload: RoleAssignment) -> UserRoleAssignment:
    store = get_store(request)
    role_assignment = await store.assign_role(payload)
    return role_assignment


@router.get("/roles", response_model=List[UserRoleAssignment])
async def list_roles(request: Request, role_filter: Optional[UserRole] = None) -> List[UserRoleAssignment]:
    store = get_store(request)
    return await store.list_roles(role=role_filter)


@router.get("/roles/user/{user_id}", response_model=List[UserRoleAssignment])
async def get_user_roles(request: Request, user_id: str) -> List[UserRoleAssignment]:
    store = get_store(request)
    return await store.get_user_roles(user_id)


@router.delete("/roles/{user_id}/{role}")
async def revoke_role(request: Request, user_id: str, role: UserRole, revoked_by: str) -> dict:
    store = get_store(request)
    success = await store.revoke_role(user_id, role, revoked_by)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role assignment not found")
    return {"message": "Role revoked successfully"}