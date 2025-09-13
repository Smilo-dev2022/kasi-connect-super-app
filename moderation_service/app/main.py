from __future__ import annotations

import asyncio

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .api import router as api_router
from .admin import router as admin_router
from .clients.group_chat import GroupChatClient
from .queue import AbuseQueueProcessor
from .storage import InMemoryReportStore, PostgresReportStore


def create_app() -> FastAPI:
    app = FastAPI(title="Moderation Service", version="0.1.0")

    # Core state
    use_db = (os.getenv("MOD_USE_DB", "").lower() == "true")
    if use_db:
        app.state.store = PostgresReportStore(os.getenv("MOD_DB_URL"))
        try:
            # ensure schema exists
            loop = asyncio.get_event_loop()
            loop.run_until_complete(app.state.store.create_schema())
        except Exception:
            pass
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

    @app.on_event("startup")
    async def on_startup() -> None:
        await app.state.abuse_queue.start()

    @app.on_event("shutdown")
    async def on_shutdown() -> None:
        await app.state.abuse_queue.stop()

    app.include_router(api_router)
    app.include_router(admin_router)

    return app


app = create_app()