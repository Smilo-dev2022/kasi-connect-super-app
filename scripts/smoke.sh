#!/usr/bin/env bash
set -euo pipefail

base_dir=$(cd "$(dirname "$0")/.." && pwd)

services=(
  "http://localhost:8080/health|messaging"
  "http://localhost:4010/healthz|auth"
  "http://localhost:4008/healthz|media"
  "http://localhost:4009/health|search"
  "http://localhost:8000|events"
  "http://localhost:8082/api/health|moderation"
  "http://localhost:4015/healthz|wallet"
)

fail=0
for entry in "${services[@]}"; do
  url="${entry%%|*}"
  name="${entry##*|}"
  echo "Checking $name -> $url"
  if curl -fsS -m 8 "$url" > /dev/null; then
    echo "OK: $name"
  else
    echo "FAIL: $name" >&2
    fail=1
  fi
done

exit $fail
