# Security and Compliance Overview

- TLS: All services can enforce HTTPS via `ENFORCE_HTTPS=true` and rely on reverse proxy headers. Use a proper TLS terminator (e.g., ALB/Nginx/Ingress) in production with HSTS.
- Secrets: See `docs/SECURITY_SECRETS_HANDLING.md`. `.env` files are gitignored; use a secrets manager in prod.
- POPIA: See `docs/POPIA_BASELINE.md` for baseline controls and responsibilities.
- Logging: Avoid logging PII; scrub sensitive fields. Restrict log retention.
- CORS: Lock down origins in production; defaults are permissive for local dev.