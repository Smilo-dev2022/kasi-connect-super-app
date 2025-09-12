from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change"
    database_url: str = "sqlite:///events.db"
    base_url: str = "http://localhost:8000"

    model_config = {
        "env_prefix": "events_",
        "case_sensitive": False,
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
