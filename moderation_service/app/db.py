from __future__ import annotations

import os
from typing import Iterator
from sqlmodel import SQLModel, Session, create_engine


MOD_DB_URL = os.environ.get("MOD_DB_URL")
engine = create_engine(MOD_DB_URL or "sqlite:///./moderation.db", echo=False)


def init_db() -> None:
    # Ensure SQLModel metadata is registered before creating tables
    import importlib
    importlib.import_module('.sqlmodels', package=__package__)
    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session

