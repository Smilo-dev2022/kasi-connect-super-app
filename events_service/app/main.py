from __future__ import annotations

from datetime import datetime

from fastapi import FastAPI, Request, Depends, Form, HTTPException
import time
import json
from prometheus_fastapi_instrumentator import Instrumentator
from fastapi.responses import HTMLResponse, RedirectResponse, Response, JSONResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


# JSON API
@app.get("/health")
def health():
    return {"status": "ok"}

# Metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# Structured access logs
@app.middleware("http")
async def access_log(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = int((time.time() - start) * 1000)
    log = {
        "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "level": "info",
        "service": "events_service",
        "request_id": request.headers.get("x-request-id") or "-",
        "route": request.url.path,
        "status": response.status_code,
        "latency_ms": duration_ms,
    }
    print(json.dumps(log))
    return response


@app.get("/api/events")
@limiter.limit("60/minute")
def api_events(session=Depends(get_session)):
    events = session.exec(select(Event).where(Event.is_published == True)).all()
    def serialize(e: Event):
        return {
            "id": e.id,
            "slug": e.slug,
            "title": e.title,
            "description": e.description,
            "location": e.location,
            "start_at": e.start_at.isoformat(),
            "end_at": e.end_at.isoformat() if e.end_at else None,
            "capacity": e.capacity,
            "is_published": e.is_published,
        }
    return {"ok": True, "events": [serialize(e) for e in events]}


@app.get("/api/events/{slug}")
@limiter.limit("60/minute")
def api_event_detail(slug: str, session=Depends(get_session)):
    event = session.exec(select(Event).where(Event.slug == slug)).first()
    if not event or not event.is_published:
        raise HTTPException(404, "Event not found")
    rsvp_count = len(session.exec(select(RSVP).where(RSVP.event_id == event.id)).all())
    return {
        "ok": True,
        "event": {
            "id": event.id,
            "slug": event.slug,
            "title": event.title,
            "description": event.description,
            "location": event.location,
            "start_at": event.start_at.isoformat(),
            "end_at": event.end_at.isoformat() if event.end_at else None,
            "capacity": event.capacity,
            "is_published": event.is_published,
            "rsvp_count": rsvp_count,
        },
    }


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


@app.post("/api/events/{slug}/rsvp")
@limiter.limit("10/minute")
def api_create_rsvp(
    slug: str,
    name: str = Form(...),
    email: str = Form(...),
    session=Depends(get_session),
):
    event = session.exec(select(Event).where(Event.slug == slug)).first()
    if not event or not event.is_published:
        raise HTTPException(404, "Event not found")

    if event.capacity is not None:
        count = session.exec(select(RSVP).where(RSVP.event_id == event.id)).all()
        if len(count) >= event.capacity:
            raise HTTPException(400, "Event is at capacity")

    existing = session.exec(
        select(RSVP).where(RSVP.event_id == event.id).where(RSVP.email == email)
    ).first()
    if existing:
        ticket = session.exec(select(Ticket).where(Ticket.rsvp_id == existing.id)).first()
        return {
            "ok": True,
            "rsvp_id": existing.id,
            "ticket_id": ticket.id if ticket else None,
            "token": ticket.token if ticket else None,
        }

    rsvp = RSVP(event_id=event.id, name=name, email=email, status="confirmed")
    session.add(rsvp)
    session.flush()

    payload = {"r": rsvp.id, "e": event.id, "ts": datetime.utcnow().isoformat()}
    token = sign_ticket_payload(payload)

    ticket = Ticket(rsvp_id=rsvp.id, token=token, status="valid")
    session.add(ticket)
    session.commit()

    return {"ok": True, "rsvp_id": rsvp.id, "ticket_id": ticket.id, "token": token}


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


@app.get("/api/tickets/{ticket_id}")
@limiter.limit("60/minute")
def api_ticket(ticket_id: int, session=Depends(get_session)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(404, "Ticket not found")
    rsvp = session.get(RSVP, ticket.rsvp_id)
    event = session.get(Event, rsvp.event_id) if rsvp else None
    return {
        "ok": True,
        "ticket": {
            "id": ticket.id,
            "rsvp_id": ticket.rsvp_id,
            "token": ticket.token,
            "issued_at": ticket.issued_at.isoformat(),
            "checked_in_at": ticket.checked_in_at.isoformat() if ticket.checked_in_at else None,
            "status": ticket.status,
        },
        "event": {
            "id": event.id,
            "slug": event.slug,
            "title": event.title,
        } if event else None,
        "rsvp": {
            "id": rsvp.id,
            "name": rsvp.name,
            "email": rsvp.email,
        } if rsvp else None,
    }


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
