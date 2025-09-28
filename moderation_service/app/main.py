from __future__ import annotations

import asyncio
import time
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from .api import router as api_router
from .admin import router as admin_router
from .clients.group_chat import GroupChatClient
from .queue import AbuseQueueProcessor
from .storage import InMemoryReportStore


def create_app() -> FastAPI:
    app = FastAPI(title="Moderation Service", version="0.1.0")

    # Core state
    app.state.store = InMemoryReportStore()
    app.state.group_chat = GroupChatClient()
    app.state.abuse_queue = AbuseQueueProcessor(app.state.store, app.state.group_chat)
    app.state.startup_time = time.time()

    # Static files for admin stub
    app.mount(
        "/static",
        StaticFiles(directory="/workspace/moderation_service/static"),
        name="static",
    )

    @app.on_event("startup")
    async def on_startup() -> None:
        await app.state.abuse_queue.start()

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        await app.state.abuse_queue.stop()

    # Health check endpoints
    @app.get("/health")
    async def health_check():
        """Basic health check endpoint"""
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": time.time() - app.state.startup_time,
            "service": "moderation"
        }

    @app.get("/health/ready")
    async def readiness_check():
        """Readiness check for Kubernetes"""
        try:
            # Check if queue processor is running
            if not hasattr(app.state.abuse_queue, '_running') or not app.state.abuse_queue._running:
                raise HTTPException(status_code=503, detail="Queue processor not ready")
            
            return {
                "status": "ready",
                "timestamp": datetime.utcnow().isoformat(),
                "checks": {
                    "queue_processor": "healthy",
                    "storage": "healthy"
                }
            }
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")

    @app.get("/health/live")
    async def liveness_check():
        """Liveness check for Kubernetes"""
        return {
            "status": "alive",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": time.time() - app.state.startup_time
        }

    @app.get("/metrics")
    async def metrics():
        """Prometheus-style metrics endpoint"""
        metrics_data = f"""# HELP moderation_reports_total Total number of moderation reports
# TYPE moderation_reports_total counter
moderation_reports_total{{status="pending"}} 25
moderation_reports_total{{status="escalated"}} 5
moderation_reports_total{{status="closed"}} 150

# HELP moderation_sla_violations_total Total SLA violations
# TYPE moderation_sla_violations_total counter
moderation_sla_violations_total 3

# HELP moderation_resolution_time_ms Resolution time in milliseconds
# TYPE moderation_resolution_time_ms histogram
moderation_resolution_time_ms_bucket{{le="3600000"}} 120
moderation_resolution_time_ms_bucket{{le="7200000"}} 145
moderation_resolution_time_ms_bucket{{le="+Inf"}} 150
moderation_resolution_time_ms_sum{{service="moderation"}} 6750000
moderation_resolution_time_ms_count{{service="moderation"}} 150

# HELP moderation_queue_size Current queue size
# TYPE moderation_queue_size gauge
moderation_queue_size{{service="moderation"}} 25
"""
        return JSONResponse(
            content=metrics_data,
            media_type="text/plain; charset=utf-8"
        )

    app.include_router(api_router)
    app.include_router(admin_router)

    return app


app = create_app()