#!/usr/bin/env bash
set -euo pipefail

DB_URL=${DATABASE_URL:-${MOD_DB_URL:-postgresql://kasilink:kasilink@localhost:5432/kasilink}}

psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$(dirname "$0")/migrate.sql"
echo "Moderation migrations applied"
