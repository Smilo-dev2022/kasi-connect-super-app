from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session

from ..db import get_session
from ..models import Media

router = APIRouter(prefix="/api", tags=["Media"])  # mounted at /api


@router.post("/media/upload-url")
def get_upload_url(*, session: Session = Depends(get_session), kind: str, mime: str, size: int):
    if kind not in ("image", "video", "audio", "file"):
        raise HTTPException(status_code=400, detail="invalid_kind")
    now = datetime.utcnow()
    media_id = f"med_{int(now.timestamp()*1000)}"
    # For demo: local uploads not implemented; return placeholder URL
    upload_url = f"https://example-upload.local/{media_id}"
    media = Media(id=media_id, kind=kind, original_url=upload_url, status="pending")
    session.add(media)
    session.commit()
    return {"upload_url": upload_url, "media_id": media_id}


@router.post("/media/complete", status_code=202)
def complete_upload(*, session: Session = Depends(get_session), media_id: str):
    media = session.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=400, detail="media_not_found")
    # Mark as ready for demo
    media.status = "ready"
    session.add(media)
    session.commit()
    return {"ok": True}


@router.get("/media/{id}/thumb")
def media_thumb(id: str, size: Optional[str] = None, session: Session = Depends(get_session)):
    media = session.get(Media, id)
    if not media or not media.thumb_url:
        raise HTTPException(status_code=404, detail="not_found")
    return RedirectResponse(url=media.thumb_url, status_code=302)


@router.get("/media/{id}/stream.m3u8")
def media_stream(id: str, session: Session = Depends(get_session)):
    media = session.get(Media, id)
    if not media or not media.meta:
        raise HTTPException(status_code=404, detail="not_found")
    # Expect meta to contain an hls_url in real implementation
    # Demo: redirect to original_url
    return RedirectResponse(url=media.original_url, status_code=302)
