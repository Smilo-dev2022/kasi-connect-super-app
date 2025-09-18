# Launch Infra Readiness (Prod/Staging)

Sizing (initial targets)
- Messaging (Agent7): 1–2 pods, 0.5–1 vCPU, 512–1024MB RAM, HPA on CPU and WS conns
- Wallet/Events (FastAPI): 2 pods, 0.5 vCPU, 512MB RAM; DB: Postgres 1 vCPU/2GB
- Media: 1–2 pods, 0.5 vCPU, 512MB RAM; MinIO/S3 external service
- Search (Typesense): 1 node, 2 vCPU, 4GB RAM (dev-scale), SSD
- Moderation: 1 pod, 0.5 vCPU, 512MB RAM; Redis/Postgres as configured

Config & Flags
- USE_DB=true, MOD_USE_DB=true in API services
- Frontend built with VITE_JWT_ONLY=true
- Secrets set: JWT_SECRET, S3 keys, Typesense API key, DB creds
- CORS_ORIGIN restricted to app domains; HTTPS redirects enabled

Observability
- Metrics: /metrics scraped by Prometheus for wallet/events/moderation
- Logs: structured JSON; retention 7–14 days; error alerts
- Dashboards: latency p50/p95, error rate, WS connections, queue depth

Reliability
- Health endpoints wired to LBs; readiness probes
- HPA configured on CPU/RAM (and custom metrics if available)
- Backups: Postgres daily snapshots; MinIO/S3 versioning or lifecycle
- Rollback: image pinning; previous deployment kept; feature flags

Security
- Secrets via K8s Secrets or cloud manager; no dev defaults in prod
- HTTPS everywhere; WAF rules basic OWASP
- Rate limits at gateway for auth, OTP, media, messaging HTTP

Runbooks
- On-call contact; SLOs; incident template
- Rollback steps; database migration backout
- Data retention policy references (POPIA baseline)