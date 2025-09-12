#!/usr/bin/env bash
set -euo pipefail

# Generate a local development CA and a localhost certificate with SANs
# Output directory can be overridden with CERT_DIR env var

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CERT_DIR="${CERT_DIR:-$ROOT_DIR/certs}"

mkdir -p "$CERT_DIR"

CA_KEY="$CERT_DIR/dev-ca.key"
CA_CRT="$CERT_DIR/dev-ca.pem"
SERNUM_FILE="$CERT_DIR/dev-ca.srl"

SRV_KEY="$CERT_DIR/localhost-key.pem"
SRV_CSR="$CERT_DIR/localhost.csr"
SRV_CRT="$CERT_DIR/localhost.pem"
OPENSSL_CNF="$CERT_DIR/localhost.openssl.cnf"

cat > "$OPENSSL_CNF" <<'EOF'
[ req ]
default_bits       = 2048
distinguished_name = req_distinguished_name
req_extensions     = v3_req
prompt             = no

[ req_distinguished_name ]
CN = localhost

[ v3_req ]
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

if [[ ! -f "$CA_KEY" || ! -f "$CA_CRT" ]]; then
  echo "[+] Creating development CA"
  openssl genrsa -out "$CA_KEY" 4096 >/dev/null 2>&1
  openssl req -x509 -new -nodes -key "$CA_KEY" -sha256 -days 3650 \
    -subj "/CN=Dev Local CA" -out "$CA_CRT" >/dev/null 2>&1
else
  echo "[=] Reusing existing development CA at $CA_CRT"
fi

echo "[+] Creating localhost certificate"
openssl genrsa -out "$SRV_KEY" 2048 >/dev/null 2>&1
openssl req -new -key "$SRV_KEY" -out "$SRV_CSR" -config "$OPENSSL_CNF" >/dev/null 2>&1

openssl x509 -req -in "$SRV_CSR" -CA "$CA_CRT" -CAkey "$CA_KEY" -CAcreateserial \
  -out "$SRV_CRT" -days 825 -sha256 -extfile "$OPENSSL_CNF" -extensions v3_req >/dev/null 2>&1

rm -f "$SRV_CSR"

echo
echo "Certificates created in: $CERT_DIR"
echo "- CA:   $CA_CRT (key: $CA_KEY)"
echo "- Cert: $SRV_CRT (key: $SRV_KEY)"
echo
echo "To trust the CA locally (Linux):"
echo "  sudo cp '$CA_CRT' /usr/local/share/ca-certificates/dev-local-ca.crt && sudo update-ca-certificates"
echo "On macOS: open Keychain Access, import the CA and set to 'Always Trust'"
echo
echo "Set DEV_SSL=1 to enable HTTPS for local services that support it."

