from __future__ import annotations

import base64
import io
from typing import Optional

import qrcode
from ics import Calendar, Event as IcsEvent


def generate_qr_base64_png(data: str) -> str:
    qr = qrcode.QRCode(version=1, box_size=8, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def build_event_ics(
    *,
    title: str,
    description: Optional[str],
    location: Optional[str],
    start_iso: str,
    end_iso: Optional[str],
    url: Optional[str] = None,
) -> str:
    cal = Calendar()
    event = IcsEvent()
    event.name = title
    if description:
        event.description = description
    if location:
        event.location = location
    event.begin = start_iso
    if end_iso:
        event.end = end_iso
    if url:
        event.url = url
    cal.events.add(event)
    return str(cal)
