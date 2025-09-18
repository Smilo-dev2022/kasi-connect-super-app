from __future__ import annotations

import asyncio
from typing import List

from .models import ReportCreate
from .storage import InMemoryReportStore


async def main() -> None:
    store = InMemoryReportStore()
    samples: List[ReportCreate] = [
        ReportCreate(content_id="post-1001", content_text="Spam post about crypto", reason="spam", reporter_id="u1"),
        ReportCreate(content_id="post-1002", content_text="Harassment in comments", reason="abuse", reporter_id="u2"),
        ReportCreate(content_id="post-1003", content_text="Misinformation link", reason="misinfo", reporter_id="u3"),
    ]
    for s in samples:
        r = await store.create_report(s)
        print("seeded_report", r.id, r.reason)


if __name__ == "__main__":
    asyncio.run(main())

