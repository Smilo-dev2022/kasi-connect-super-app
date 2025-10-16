#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${1:-http://localhost:8001}
WARDS=${WARDS:-"Ward 48,Ward 50"}
SOURCE=${SOURCE:-seed}

IFS=',' read -ra WLIST <<< "$WARDS"
for w in "${WLIST[@]}"; do
  echo "Seeding ward metric for: $w"
  curl -sS -X POST "${BASE_URL}/api/metrics/ward" \
    --data-urlencode "ward=${w}" \
    --data-urlencode "source=${SOURCE}" \
    --data-urlencode "payload=$(date -Is)" \
    | (command -v jq >/dev/null 2>&1 && jq . || cat)
done

echo "Done. Check freshness at: ${BASE_URL}/api/metrics/ward/freshness"
