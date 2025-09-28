#!/usr/bin/env bash
set -euo pipefail

# Run the moderation service
exec uvicorn app.main:app --host 0.0.0.0 --port 8082 --reload