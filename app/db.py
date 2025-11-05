from typing import Iterator

import os
from sqlmodel import SQLModel, Session, create_engine
from sqlalchemy import text


DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./events.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
)


def init_db() -> None:
    from . import models  # noqa: F401 - ensure models are imported for table creation

    SQLModel.metadata.create_all(engine)
    # Apply supplemental SQLite schema (FTS, triggers, indices) from db/schema.sql
    schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db", "schema.sql")
    if os.path.exists(schema_path):
        with open(schema_path, "r", encoding="utf-8") as f:
            sql_text = f.read()
        # Execute as a single script; SQLAlchemy text() will handle semicolons correctly on SQLite
        with engine.begin() as conn:
            for statement in filter(None, [s.strip() for s in sql_text.split(";\n")]):
                # Skip comments and empty fragments
                if not statement or statement.startswith("--"):
                    continue
                conn.exec_driver_sql(statement)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session

