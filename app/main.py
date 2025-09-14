from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse

from .db import init_db, get_session
from .routers.events import router as events_router
from .routers.rsvps import router as rsvps_router
from .routers.reminders import router as reminders_router
from .routers.wallet import router as wallet_router


def create_app() -> FastAPI:
    app = FastAPI(title="Events Service", version="0.1.0")

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
    app.include_router(wallet_router)

    app.mount("/static", StaticFiles(directory="app/static"), name="static")

    @app.get("/", include_in_schema=False)
    def index() -> RedirectResponse:
        return RedirectResponse(url="/static/index.html", status_code=307)

    return app


app = create_app()

