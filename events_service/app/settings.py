from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change"
    database_url: str = "sqlite:///events.db"
    base_url: str = "http://localhost:8000"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {
        "env_prefix": "events_",
        "case_sensitive": False,
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    # Production guardrails
    if (settings.base_url.startswith("https://") is False) and (
        (settings.base_url.startswith("http://localhost") is False)
        and (settings.base_url.startswith("http://127.0.0.1") is False)
    ):
        # In non-local environments, require https base_url
        raise RuntimeError("events_service base_url must be https in production")
    if settings.secret_key == "dev-secret-change" and not settings.base_url.startswith("http://"):
        raise RuntimeError("events_service secret_key must be set in production")
    return settings
