from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import RedirectResponse

from .db import init_db, get_session
from .routers.events import router as events_router
from .routers.rsvps import router as rsvps_router
from .routers.reminders import router as reminders_router
from .routers.wallet import router as wallet_router
from fastapi import Request
from fastapi.responses import Response
from prometheus_client import CollectorRegistry, Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import time
import uuid
import json


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
    # Metrics and logging
    registry: CollectorRegistry = CollectorRegistry()
    http_requests_total = Counter(
        "http_requests_total",
        "Total HTTP requests",
        labelnames=("service", "method", "route", "status"),
        registry=registry,
    )
    http_request_duration_ms = Histogram(
        "http_request_duration_ms",
        "HTTP request duration in ms",
        labelnames=("service", "method", "route", "status"),
        buckets=(5,10,25,50,100,250,500,1000,2500,5000),
        registry=registry,
    )
    wallet_request_total = Counter("wallet_request_total", "Wallet requests created", registry=registry)
    wallet_mark_paid_total = Counter("wallet_mark_paid_total", "Wallet mark paid operations", registry=registry)
    wallet_state_change_total = Counter("wallet_state_change_total", "Wallet state transitions", registry=registry)
    # expose for routers
    app.state.metrics_registry = registry
    app.state.wallet_request_total = wallet_request_total
    app.state.wallet_mark_paid_total = wallet_mark_paid_total
    app.state.wallet_state_change_total = wallet_state_change_total

    @app.middleware("http")
    async def metrics_and_logs(request: Request, call_next):
        service = "wallet_py"
        req_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000.0
        route = request.url.path
        status = str(response.status_code)
        http_requests_total.labels(service, request.method, route, status).inc()
        http_request_duration_ms.labels(service, request.method, route, status).observe(duration_ms)
        response.headers["x-request-id"] = req_id
        print(json.dumps({
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "level": "info",
            "service": service,
            "request_id": req_id,
            "route": route,
            "method": request.method,
            "status": int(status),
            "latency_ms": round(duration_ms, 3),
        }))
        return response

    @app.get("/metrics")
    def metrics() -> Response:
        return Response(generate_latest(registry), media_type=CONTENT_TYPE_LATEST)
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

