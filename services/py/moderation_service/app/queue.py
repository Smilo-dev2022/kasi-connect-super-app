from __future__ import annotations

import asyncio
from typing import Optional

from .models import ReportStatus
from .storage import InMemoryReportStore
from .clients.group_chat import GroupChatClient


class AbuseQueueProcessor:
    """Background processor for abuse reports."""

    def __init__(self, store: InMemoryReportStore, group_chat: GroupChatClient) -> None:
        self._store = store
        self._group_chat = group_chat
        self._queue: asyncio.Queue[str] = asyncio.Queue()
        self._task: Optional[asyncio.Task] = None

    async def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def enqueue(self, report_id: str) -> None:
        # Mark as queued as soon as we accept it
        await self._store.update_status(report_id, ReportStatus.QUEUED)
        await self._queue.put(report_id)

    async def _run(self) -> None:
        while True:
            report_id = await self._queue.get()
            try:
                report = await self._store.get_report(report_id)
                if report is None:
                    continue
                await self._group_chat.send_report(report)
                await self._store.update_status(report.id, ReportStatus.IN_REVIEW)
            finally:
                self._queue.task_done()

