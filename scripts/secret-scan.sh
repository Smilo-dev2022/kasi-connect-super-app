#!/usr/bin/env bash
set -euo pipefail

# Simple lightweight secret scan using ripgrep. For robust scanning, use gitleaks or detect-secrets.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required. Install it and re-run." >&2
  exit 2
fi

echo "[+] Scanning for high-risk patterns..."
rg --hidden --ignore-file .gitignore --glob '!*lock*' --glob '!certs/**' --glob '!*dist*' -n \
  -e 'AWS.{0,50}(SECRET|ACCESS)_KEY' \
  -e 'AKIA[0-9A-Z]{16}' \
  -e '-----BEGIN( RSA)? PRIVATE KEY-----' \
  -e 'xox[baprs]-[0-9a-zA-Z-]+' \
  -e 'SECRET[_-]?KEY\s*=' \
  -e 'API[_-]?KEY\s*=' \
  -e 'PASSWORD\s*=' \
  -e 'client_secret' \
  -e 'db_password' \
  -e 'token\s*=' \
  -e 'BEGIN OPENSSH PRIVATE KEY' \
  || true

echo
echo "[i] For production-grade scanning, consider adding gitleaks or Yelp detect-secrets via pre-commit."

