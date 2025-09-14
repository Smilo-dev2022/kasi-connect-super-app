#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export PYTHONPATH="${PYTHONPATH:-}:$(pwd)"

echo "[wallet] running alembic migrations"
cd app
alembic upgrade head | cat
cd - >/dev/null

echo "[events_service] creating tables (sqlmodel create_all on startup)"

echo "Done."

