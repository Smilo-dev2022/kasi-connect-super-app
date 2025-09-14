from typing import Iterator

import os
from sqlmodel import SQLModel, Session, create_engine


DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./events.db")

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    from . import models  # noqa: F401 - ensure models are imported for table creation

    SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session

