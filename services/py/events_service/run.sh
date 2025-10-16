#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ -d .venv ]; then
  source .venv/bin/activate || true
fi
export EVENTS_SECRET_KEY=${EVENTS_SECRET_KEY:-change-me}
export EVENTS_DATABASE_URL=${EVENTS_DATABASE_URL:-sqlite:///events.db}
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
