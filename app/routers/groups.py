from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel

from ..db import get_session
from ..models import Group, GroupCreate, GroupUpdate, GroupMember

router = APIRouter(prefix="/api", tags=["Groups", "Members"])  # mounted at /api


@router.post("/groups", response_model=Group, status_code=201)
def create_group(*, session: Session = Depends(get_session), data: GroupCreate) -> Group:
    now = datetime.utcnow()
    group = Group(
        id=f"grp_{int(now.timestamp()*1000)}",
        name=data.name,
        photo_url=data.photo_url,
        is_safety_room=bool(data.is_safety_room or False),
        created_by="system",  # TODO: replace with auth user
        created_at=now,
        updated_at=now,
    )
    session.add(group)
    session.commit()
    session.refresh(group)
    # creator becomes owner member
    gm = GroupMember(group_id=group.id, user_id=group.created_by, role="owner", joined_at=now)
    session.add(gm)
    session.commit()
    return group


@router.get("/groups/{id}", response_model=Group)
def get_group(*, session: Session = Depends(get_session), id: str) -> Group:
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.patch("/groups/{id}", response_model=Group)
def update_group(*, session: Session = Depends(get_session), id: str, data: GroupUpdate) -> Group:
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    changed = False
    if data.name is not None:
        group.name = data.name
        changed = True
    if data.photo_url is not None:
        group.photo_url = data.photo_url
        changed = True
    if changed:
        group.updated_at = datetime.utcnow()
        session.add(group)
        session.commit()
        session.refresh(group)
    return group


class AddMemberRequest(BaseModel):
    user_id: str


@router.post("/groups/{id}/members", response_model=GroupMember, status_code=201)
def add_member(*, session: Session = Depends(get_session), id: str, data: AddMemberRequest) -> GroupMember:
    group = session.get(Group, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    existing = session.get(GroupMember, (id, data.user_id))
    if existing:
        return existing
    member = GroupMember(group_id=id, user_id=data.user_id, role="member")
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.delete("/groups/{id}/members/{user_id}", status_code=204)
def remove_member(*, session: Session = Depends(get_session), id: str, user_id: str) -> None:
    gm = session.get(GroupMember, (id, user_id))
    if not gm:
        return
    session.delete(gm)
    session.commit()


class ChangeRoleRequest(BaseModel):
    user_id: str
    role: str


@router.patch("/groups/{id}/roles", response_model=GroupMember)
def change_role(*, session: Session = Depends(get_session), id: str, data: ChangeRoleRequest) -> GroupMember:
    if data.role not in ("owner", "admin", "member"):
        raise HTTPException(status_code=400, detail="invalid_role")
    gm = session.get(GroupMember, (id, data.user_id))
    if not gm:
        raise HTTPException(status_code=404, detail="member_not_found")
    gm.role = data.role
    session.add(gm)
    session.commit()
    session.refresh(gm)
    return gm
