from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse
import os
from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware import Middleware

from .db import init_db, get_session
from .routers.events import router as events_router
from .routers.rsvps import router as rsvps_router
from .routers.reminders import router as reminders_router


def create_app() -> FastAPI:
    enforce_https = (os.environ.get("ENFORCE_HTTPS") or "false").lower() == "true"
    allowed_hosts_env = os.environ.get("ALLOWED_HOSTS")
    middleware = []
    if enforce_https:
        middleware.append(Middleware(HTTPSRedirectMiddleware))
    if allowed_hosts_env:
        allowed_hosts = [h.strip() for h in allowed_hosts_env.split(",") if h.strip()]
        if allowed_hosts:
            middleware.append(Middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts))
    app = FastAPI(title="Events Service", version="0.1.0", middleware=middleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        init_db()
        # seed data
        from .seeds import seed_initial_data
        from sqlmodel import Session

        for session in get_session():
            seed_initial_data(session)
            break

    app.include_router(events_router, prefix="/events", tags=["events"]) 
    app.include_router(rsvps_router, tags=["rsvps"]) 
    app.include_router(reminders_router, tags=["reminders"]) 

    app.mount("/static", StaticFiles(directory="app/static"), name="static")

    @app.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        if enforce_https:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    @app.get("/", include_in_schema=False)
    def index() -> RedirectResponse:
        return RedirectResponse(url="/static/index.html", status_code=307)

    return app


app = create_app()

