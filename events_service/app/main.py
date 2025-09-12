from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, Request, Depends, Form, HTTPException
from fastapi.responses import HTMLResponse, RedirectResponse, Response, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlmodel import select, Session

from slowapi import Limiter, _rate_limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from .db import init_db, get_session, engine
from .models import Event, RSVP, Ticket, CheckIn
from .security import sign_ticket_payload, verify_ticket_token
from .settings import get_settings
from .utils import generate_qr_base64_png, build_event_ics


app = FastAPI(title="Events Service")
app.mount("/static", StaticFiles(directory="/workspace/events_service/static"), name="static")
templates = Jinja2Templates(directory="/workspace/events_service/templates")
settings = get_settings()

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limiter)
app.add_middleware(SlowAPIMiddleware)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    # Seed a sample event for local usage if none exists
    with Session(engine) as s:
        existing = s.exec(select(Event)).first()
        if not existing:
            e = Event(
                slug="launch-party",
                title="Product Launch Party",
                description="Come celebrate our launch!",
                location="HQ Atrium",
                start_at=datetime.utcnow(),
                end_at=None,
                capacity=200,
                is_published=True,
            )
            s.add(e)
            s.commit()


@app.get("/", response_class=HTMLResponse)
@limiter.limit("60/minute")
def index(request: Request, session=Depends(get_session)):
    events = session.exec(select(Event).where(Event.is_published == True)).all()
    return templates.TemplateResponse("index.html", {"request": request, "events": events})


@app.get("/events/{slug}", response_class=HTMLResponse)
@limiter.limit("60/minute")
def event_detail(slug: str, request: Request, session=Depends(get_session)):
    event = session.exec(select(Event).where(Event.slug == slug)).first()
    if not event or not event.is_published:
        raise HTTPException(404, "Event not found")
    return templates.TemplateResponse("event_detail.html", {"request": request, "event": event})


@app.get("/events/{slug}/ics")
@limiter.limit("30/minute")
def event_ics(slug: str, session=Depends(get_session)):
    event = session.exec(select(Event).where(Event.slug == slug)).first()
    if not event:
        raise HTTPException(404, "Event not found")
    ics_text = build_event_ics(
        title=event.title,
        description=event.description,
        location=event.location,
        start_iso=event.start_at.isoformat(),
        end_iso=event.end_at.isoformat() if event.end_at else None,
        url=f"{settings.base_url}/events/{event.slug}",
    )
    return Response(content=ics_text, media_type="text/calendar")


@app.post("/events/{slug}/rsvp")
@limiter.limit("10/minute")
def create_rsvp(
    slug: str,
    name: str = Form(...),
    email: str = Form(...),
    session=Depends(get_session),
):
    event = session.exec(select(Event).where(Event.slug == slug)).first()
    if not event or not event.is_published:
        raise HTTPException(404, "Event not found")

    # Basic capacity check
    if event.capacity is not None:
        count = session.exec(select(RSVP).where(RSVP.event_id == event.id)).all()
        if len(count) >= event.capacity:
            raise HTTPException(400, "Event is at capacity")

    # Prevent duplicate RSVP per event/email
    existing = session.exec(
        select(RSVP).where(RSVP.event_id == event.id).where(RSVP.email == email)
    ).first()
    if existing:
        return RedirectResponse(url=f"/rsvp/{existing.id}/confirm", status_code=303)

    rsvp = RSVP(event_id=event.id, name=name, email=email, status="confirmed")
    session.add(rsvp)
    session.flush()

    payload = {"r": rsvp.id, "e": event.id, "ts": datetime.utcnow().isoformat()}
    token = sign_ticket_payload(payload)

    ticket = Ticket(rsvp_id=rsvp.id, token=token, status="valid")
    session.add(ticket)
    session.commit()

    return RedirectResponse(url=f"/rsvp/{rsvp.id}/confirm", status_code=303)


@app.get("/rsvp/{rsvp_id}/confirm", response_class=HTMLResponse)
@limiter.limit("60/minute")
def rsvp_confirm(rsvp_id: int, request: Request, session=Depends(get_session)):
    rsvp = session.get(RSVP, rsvp_id)
    if not rsvp:
        raise HTTPException(404, "RSVP not found")
    event = session.get(Event, rsvp.event_id)
    ticket = session.exec(select(Ticket).where(Ticket.rsvp_id == rsvp.id)).first()
    return templates.TemplateResponse(
        "rsvp_confirm.html",
        {"request": request, "rsvp": rsvp, "event": event, "ticket": ticket},
    )


@app.get("/ticket/{ticket_id}", response_class=HTMLResponse)
@limiter.limit("60/minute")
def ticket_page(ticket_id: int, request: Request, session=Depends(get_session)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    rsvp = session.get(RSVP, ticket.rsvp_id)
    event = session.get(Event, rsvp.event_id) if rsvp else None
    qr_data_url = generate_qr_base64_png(ticket.token)
    return templates.TemplateResponse(
        "ticket.html",
        {"request": request, "ticket": ticket, "rsvp": rsvp, "event": event, "qr": qr_data_url},
    )


@app.get("/scanner", response_class=HTMLResponse)
@limiter.limit("60/minute")
def scanner_page(request: Request):
    return templates.TemplateResponse("scanner.html", {"request": request})


@app.get("/checkin/verify")
@limiter.limit("60/minute")
def verify(token: str, session=Depends(get_session)):
    payload = verify_ticket_token(token)
    if not payload:
        return JSONResponse(status_code=400, content={"ok": False, "error": "invalid_token"})
    ticket = session.exec(select(Ticket).where(Ticket.token == token)).first()
    if not ticket:
        return JSONResponse(status_code=404, content={"ok": False, "error": "ticket_not_found"})
    return {
        "ok": True,
        "ticket_id": ticket.id,
        "rsvp_id": ticket.rsvp_id,
        "checked_in_at": ticket.checked_in_at.isoformat() if ticket.checked_in_at else None,
        "status": ticket.status,
    }


@app.post("/checkin")
@limiter.limit("60/minute")
def check_in(token: str = Form(...), session=Depends(get_session)):
    payload = verify_ticket_token(token)
    if not payload:
        return JSONResponse(status_code=400, content={"ok": False, "error": "invalid_token"})
    ticket = session.exec(select(Ticket).where(Ticket.token == token)).first()
    if not ticket:
        return JSONResponse(status_code=404, content={"ok": False, "error": "ticket_not_found"})
    if ticket.checked_in_at is not None:
        return {"ok": True, "ticket_id": ticket.id, "already": True}
    ticket.checked_in_at = datetime.utcnow()
    session.add(ticket)
    session.add(CheckIn(ticket_id=ticket.id))
    session.commit()
    return {"ok": True, "ticket_id": ticket.id, "checked_in_at": ticket.checked_in_at.isoformat()}


@app.get("/admin/events/{slug}/rsvps.csv")
@limiter.limit("10/minute")
def export_rsvps_csv(slug: str, session=Depends(get_session)):
    event = session.exec(select(Event).where(Event.slug == slug)).first()
    if not event:
        raise HTTPException(404, "Event not found")
    rows = session.exec(select(RSVP).where(RSVP.event_id == event.id)).all()
    lines = ["id,name,email,status,created_at"]
    for r in rows:
        lines.append(
            ",".join(
                [
                    str(r.id),
                    r.name.replace(",", " "),
                    r.email,
                    r.status,
                    r.created_at.isoformat(),
                ]
            )
        )
    csv_text = "\n".join(lines) + "\n"
    return PlainTextResponse(content=csv_text, media_type="text/csv")
