#!/usr/bin/env bash
set -euo pipefail

PG_URL=${PG_URL:-postgresql://app:app@localhost:5432/messaging}

psql "$PG_URL" -v ON_ERROR_STOP=1 -f agent7-messaging/scripts/migrate.sql
psql "$PG_URL" -v ON_ERROR_STOP=1 -f agent7-messaging/scripts/seed.sql
echo "Migrations applied"
