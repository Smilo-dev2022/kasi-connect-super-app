from __future__ import annotations

from itsdangerous import URLSafeSerializer, BadSignature
from .settings import get_settings


def _serializer() -> URLSafeSerializer:
    settings = get_settings()
    return URLSafeSerializer(settings.secret_key, salt="ticket")


def sign_ticket_payload(payload: dict) -> str:
    return _serializer().dumps(payload)


def verify_ticket_token(token: str) -> dict | None:
    try:
        return _serializer().loads(token)
    except BadSignature:
        return None
