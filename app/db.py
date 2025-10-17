from typing import Iterator

import os
from sqlmodel import SQLModel, Session, create_engine


DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./events.db")

# Use SQLite-specific connect args only when using sqlite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)


def init_db() -> None:
    from . import models  # noqa: F401 - ensure models are imported for table creation

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session

