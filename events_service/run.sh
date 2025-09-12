#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ -d .venv ]; then
  source .venv/bin/activate || true
fi
export EVENTS_SECRET_KEY=${EVENTS_SECRET_KEY:-change-me}
export EVENTS_DATABASE_URL=${EVENTS_DATABASE_URL:-sqlite:///events.db}

# Enable TLS automatically if local dev certs exist
CERT_DIR_DEFAULT="$(pwd)/../certs"
CERT_DIR="${CERT_DIR:-$CERT_DIR_DEFAULT}"
KEY_FILE="${DEV_SSL_KEY:-$CERT_DIR/localhost-key.pem}"
CERT_FILE="${DEV_SSL_CERT:-$CERT_DIR/localhost.pem}"

SSL_ARGS=()
if [ -f "$KEY_FILE" ] && [ -f "$CERT_FILE" ]; then
  SSL_ARGS=(--ssl-keyfile "$KEY_FILE" --ssl-certfile "$CERT_FILE")
fi

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload "${SSL_ARGS[@]}"
