
# Security Policy


## Supported Versions

We aim to keep main branch secure. Security fixes are backported on a best-effort basis.


## Reporting a Vulnerability

- Email: [security@ikasilink.co.za](mailto:security@ikasilink.co.za)
- PGP: publish key at `/.well-known/pgp-key.txt` (TBD)
- Please include steps to reproduce and potential impact. We target initial response within 72 hours.


## Baseline Controls

- TLS: sample reverse proxies provided under `ops/` (Caddy, Nginx, Traefik). HSTS recommended for production.
- Secure headers: Helmet/@fastify/helmet enabled across Node services.
- Authentication: JWT with strong secret; OTP codes hashed with pepper.
- Rate limiting: enabled on public endpoints.
- Secrets: never committed; see `docs/SECRETS.md`. Services fail-fast in production if secrets are missing.
- CORS: tightened in production.
- Logging: avoid sensitive data; redact tokens; rotate and expire logs.


## Incident Response (IR)

1. Triage: confirm severity and scope. Create an incident channel and ticket.
2. Contain: block indicators of compromise; rotate credentials; disable affected components if needed.
3. Eradicate: patch vulnerabilities; remove malicious artifacts.
4. Recover: restore services; monitor for recurrence.
5. Postmortem: document timeline, root cause, and corrective actions.


## Hardening Checklist

- Enforce HTTPS and HSTS at the edge.
- Use managed secret stores; enable key rotation.
- Enable S3 SSE or KMS for stored media.
- Pin dependencies; run vulnerability scans in CI.
- Backup policies for databases and buckets; test restores.
- Principle of least privilege for IAM and service accounts.


## Responsible Disclosure

We support coordinated disclosure. Do not publicly share details until a fix is available.
