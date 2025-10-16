from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from ..db import get_session, engine

router = APIRouter(prefix="/api", tags=["Search"])  # mounted at /api


@router.get("/search")
def search(
    *,
    session: Session = Depends(get_session),
    q: str = Query(...),
    scope: str = Query(..., pattern="^(messages|groups)$"),
    group_id: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
):
    if scope == "messages":
        # Query FTS virtual table
        sql = "SELECT message_id, group_id FROM message_index WHERE text MATCH :q LIMIT :limit"  # nosec B608
        params: dict[str, object] = {"q": q, "limit": limit}
        if group_id:
            sql = (
                "SELECT message_id, group_id FROM message_index WHERE group_id = :gid AND text MATCH :q LIMIT :limit"
            )
            params["gid"] = group_id
        with engine.connect() as conn:
            rows = list(conn.exec_driver_sql(sql, params))
        results = [
            {"type": "message", "score": 1.0, "message": {"id": r[0], "group_id": r[1]}}
            for r in rows
        ]
        return {"items": results}
    elif scope == "groups":
        # Simple LIKE search on groups table name
        sql = "SELECT id, name FROM groups WHERE name LIKE :like ORDER BY name LIMIT :limit"  # nosec B608
        with engine.connect() as conn:
            rows = list(
                conn.exec_driver_sql(sql, {"like": f"%{q}%", "limit": limit})
            )
        results = [
            {"type": "group", "score": 1.0, "group": {"id": r[0], "name": r[1]}}
            for r in rows
        ]
        return {"items": results}
    else:
        raise HTTPException(status_code=400, detail="invalid_scope")
