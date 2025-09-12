from __future__ import annotations

import asyncio
from typing import List, Dict, Any

from ..models import Report


class GroupChatClient:
    """Stub client for a group chat integration.

    Day 1 implementation logs messages in memory and to stdout.
    """

    def __init__(self) -> None:
        self._sent_messages: List[Dict[str, Any]] = []

    @property
    def sent_messages(self) -> List[Dict[str, Any]]:
        return list(self._sent_messages)

    async def send_report(self, report: Report) -> None:
        # Simulate network I/O
        await asyncio.sleep(0)
        payload = {
            "type": "abuse_report",
            "report_id": report.id,
            "content_id": report.content_id,
            "reason": report.reason,
            "reporter_id": report.reporter_id,
            "preview": report.content_text[:200],
        }
        print(f"[GroupChat] Queued report {report.id} for content {report.content_id}: {report.reason}")
        self._sent_messages.append(payload)

