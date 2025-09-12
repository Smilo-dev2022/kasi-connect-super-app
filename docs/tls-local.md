Local TLS setup (Dev)

This enables HTTPS for local development across the frontend (Vite), the Node backend (Fastify), and the Python `events_service` (Uvicorn).

1) Generate certificates

Run:

```bash
bash scripts/dev-certs.sh
```

This creates `certs/` with:
- `dev-ca.pem` (development CA)
- `localhost.pem` and `localhost-key.pem` (server cert and key for localhost)

Optionally, trust the CA so your browser accepts the cert without warnings.
- Linux: `sudo cp certs/dev-ca.pem /usr/local/share/ca-certificates/dev-local-ca.crt && sudo update-ca-certificates`
- macOS: Import `certs/dev-ca.pem` into Keychain Access and set to Always Trust

2) Enable HTTPS in services

- Vite dev server:
  - Use `DEV_SSL=1` when starting Vite to enable HTTPS if certs are present.
  - Default cert paths: `certs/localhost-key.pem` and `certs/localhost.pem`
  - Override with `DEV_SSL_KEY` and `DEV_SSL_CERT` env vars if needed.

- Node backend (Fastify):
  - Set `DEV_SSL=1` to enable HTTPS if certs exist at the default paths.
  - Override with `DEV_SSL_KEY` and `DEV_SSL_CERT`.

- Python `events_service` (Uvicorn):
  - The `run.sh` script will automatically pass `--ssl-keyfile` and `--ssl-certfile` if the default certs exist.
  - Override with env vars: `CERT_DIR`, or set `UVICORN_SSL_KEYFILE`/`UVICORN_SSL_CERTFILE` and modify `run.sh` if desired.

3) Ports and URLs

- Vite: `https://localhost:8080`
- Backend: `https://localhost:4000`
- Events service: `https://localhost:8000`

Notes

- Certs are ignored by git via `.gitignore` and should never be committed.
- Self-signed dev CA is for local use only and must not be used in any non-dev environment.

