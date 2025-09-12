#!/usr/bin/env bash
set -euo pipefail

OUT_DIR=${1:-"certs"}
mkdir -p "$OUT_DIR"

openssl req -x509 -newkey rsa:4096 -sha256 -days 365 -nodes \
  -keyout "$OUT_DIR/dev.key" -out "$OUT_DIR/dev.crt" \
  -subj "/C=ZA/ST=Gauteng/L=Johannesburg/O=Dev/OU=Local/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Wrote $OUT_DIR/dev.crt and $OUT_DIR/dev.key"

