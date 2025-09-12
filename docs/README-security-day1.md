Security & compliance – Day 1 deliverables

- TLS setup for local services
  - `scripts/dev-certs.sh` to generate dev CA and localhost certs
  - `docs/tls-local.md` for enabling HTTPS in Vite, Fastify, Uvicorn
  - Vite and backend auto-read `certs/` when `DEV_SSL=1`

- Secrets handling
  - `docs/secrets.md` baseline guidance
  - `scripts/secret-scan.sh` quick scanner
  - `.pre-commit-config.yaml` with gitleaks and basic hooks

- POPIA baseline
  - `docs/popia-baseline.md` including data inventory template

- Device key transparency
  - `docs/device-key-transparency.md` overview
  - `agent7-messaging/src/keys_transparency.ts` client verification stub

- Session logging
  - `docs/session-logging.md` with schema and guidance

- Push security hardening
  - `docs/push-security.md` checklist and recommendations

