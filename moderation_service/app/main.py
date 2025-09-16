from __future__ import annotations

import asyncio

from fastapi import FastAPI, Request
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles

from .api import router as api_router
from .admin import router as admin_router
from .clients.group_chat import GroupChatClient
from .queue import AbuseQueueProcessor
from .storage import InMemoryReportStore, PostgresReportStore
from .db import init_db
from prometheus_client import Counter, Histogram, CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
import time
import json
import uuid
import os
from datetime import datetime, timezone, timedelta


def create_app() -> FastAPI:
    app = FastAPI(title="Moderation Service", version="0.1.0")

    # Core state
    use_db = bool(os.environ.get("MOD_DB_URL"))
    if use_db:
        init_db()
        app.state.store = PostgresReportStore()
    else:
        app.state.store = InMemoryReportStore()
    app.state.group_chat = GroupChatClient()
    app.state.abuse_queue = AbuseQueueProcessor(app.state.store, app.state.group_chat)

    # Static files for admin stub
    app.mount(
        "/static",
        StaticFiles(directory="/workspace/moderation_service/static"),
        name="static",
    )

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
    moderation_escalations_total = Counter("moderation_escalations_total", "Total escalations", registry=registry)
    moderation_sla_breaches_total = Counter("moderation_sla_breaches_total", "Total SLA breaches detected", registry=registry)

    @app.middleware("http")
    async def metrics_and_logs(request: Request, call_next):
        service = "moderation_py"
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

    app.state.moderation_escalations_total = moderation_escalations_total
    app.state.moderation_sla_breaches_total = moderation_sla_breaches_total
    app.state._sla_breached_ids = set()

    async def sla_watcher_loop() -> None:
        while True:
            try:
                # iterate reports and find SLA breaches
                # using store.list_reports(None)
                reports = await app.state.store.list_reports()
                now = datetime.now(timezone.utc)
                for r in reports:
                    try:
                        if r.closed_at is not None:
                            continue
                        if r.escalated_at is None:
                            continue
                        if r.sla_minutes is None or r.sla_minutes <= 0:
                            continue
                        due_at = r.escalated_at + timedelta(minutes=r.sla_minutes)
                        if now > due_at:
                            if r.id not in app.state._sla_breached_ids:
                                app.state._sla_breached_ids.add(r.id)
                                app.state.moderation_sla_breaches_total.inc()
                    except Exception:
                        # ignore per-report errors
                        pass
            except Exception:
                # ignore iteration errors, continue loop
                pass
            await asyncio.sleep(60)

    @app.on_event("startup")
    async def on_startup() -> None:
        await app.state.abuse_queue.start()
        app.state._sla_watcher_task = asyncio.create_task(sla_watcher_loop())

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        await app.state.abuse_queue.stop()
        task = getattr(app.state, "_sla_watcher_task", None)
        if task is not None:
            task.cancel()

    app.include_router(api_router)
    app.include_router(admin_router)

    return app


app = create_app()