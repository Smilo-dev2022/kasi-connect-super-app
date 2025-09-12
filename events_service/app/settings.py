from __future__ import annotations

from functools import lru_cache
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    secret_key: str = "dev-secret-change"
    database_url: str = "sqlite:///events.db"
    base_url: str = "https://events.localhost"
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {
        "env_prefix": "events_",
        "case_sensitive": False,
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
