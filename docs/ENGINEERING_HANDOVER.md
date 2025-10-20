# iKasiLink – Engineering Handover

## Quick setup
```bash
# Start the full dev stack
docker compose -f docker-compose.dev.yml up --build

# Web app
open http://localhost:5173

# Gateway
curl -s http://localhost:8081/health | jq

# Example proxied health checks
curl -s http://localhost:8081/api/media/health | jq
curl -s http://localhost:8081/api/mod/health | jq
```

### Minimal env
- Web app (Compose supplies):
  - `VITE_MSG_API=http://localhost:8081/api/msg`
  - `VITE_EVENTS_API=http://localhost:8081/api/events`
  - `VITE_WALLET_API=http://localhost:8081/api/wallet`
- Mobile `.env` (Android emulator):
```env
API_BASE_URL=http://10.0.2.2:8081
SOCKET_URL=ws://10.0.2.2:8080
SENTRY_DSN=
```

## Service environment matrix
| Service | Required env | Example |
|---|---|---|
| super-api | `PORT`, `HOST`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `OTP_PEPPER`, downstream URLs (`WALLET_URL`, `MEDIA_URL`, `SEARCH_URL`, `MODERATION_URL`, `MESSAGING_URL`, `EVENTS_URL`) | `PORT=8081`, `HOST=0.0.0.0`, `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app`, `JWT_SECRET=dev-secret-change-me` |
| agent7-messaging | `PORT`, `JWT_SECRET`, `FEATURE_FLAGS`, `ALLOWLIST_WARDS` | `PORT=8080`, `JWT_SECRET=devsecret`, `FEATURE_FLAGS=dark_launch`, `ALLOWLIST_WARDS=Ward 48` |
| services/media | `PORT`, `CORS_ORIGIN`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_FORCE_PATH_STYLE` | `PORT=4008`, `CORS_ORIGIN=*`, `S3_ENDPOINT=http://minio:9000`, `S3_BUCKET=media`, `S3_FORCE_PATH_STYLE=true` |
| agent9-search | `PORT`, `TYPESENSE_*` | `PORT=4009`, `TYPESENSE_HOST=typesense`, `TYPESENSE_PORT=8108`, `TYPESENSE_PROTOCOL=http`, `TYPESENSE_API_KEY=xyz` |
| events_service (Python) | `EVENTS_DATABASE_URL`, optional `CORS_ORIGINS`, `BASE_URL` | `EVENTS_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app` |
| wallet-service | `PORT`, `ALLOWED_ORIGINS`, `DATABASE_URL` | `PORT=3000`, `ALLOWED_ORIGINS=*`, `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/app` |
| moderation_service | `MOD_DB_URL` (optional; enables Postgres store) | `MOD_DB_URL=postgresql://postgres:postgres@postgres:5432/app` |

## Deployments

### Docker Compose (dev)
```bash
docker compose -f docker-compose.dev.yml up --build
```

### Helm (Kubernetes)
1. Build and push images (GHCR):
```bash
./scripts/build-images.sh
./scripts/push-images.sh
```
2. Configure Helm values per environment (images, secrets, CORS, URLs).
3. Install/upgrade charts:
```bash
helm upgrade --install events-service charts/events-service -f values-env.yaml
helm upgrade --install moderation-service charts/moderation-service -f values-env.yaml
```

### Terraform (infra)
```bash
cd infra
terraform init
terraform apply -auto-approve
```

## Rollback & recovery
- Use Helm history and `helm rollback <release> <rev>`.
- Keep previous container tags in registry; pin `:previous` for fast rollback.
- Database: ensure backups/snapshots; restore with downtime window; test restores monthly.
- Feature flags for dark launch → disable to reduce blast radius.

## Smoke tests and monitoring
```bash
# Health
curl -sf http://<gateway>/health
curl -sf http://<gateway>/api/media/health

# Metrics
curl -sf http://<gateway>/metrics
curl -sf http://<gateway>/api/mod/metrics

# Messaging WS (pseudo)
wscat -c ws://<gateway>/api/msg/ws -H "Authorization: Bearer <JWT>"
```
Dashboards: Create Prometheus/Grafana dashboards for `http_requests_total` and `http_request_duration_ms` with service label.

## API summaries (via Super API)
- `/api/auth` — JWT mint/verify via module (OTP-backed). Redirects legacy routes to `/api/msg/*` as needed.
- `/api/events` — Events (Python) CRUD/RSVP/tickets/ICS.
- `/api/wallet` — Wallet API (accounts, transactions, mobile flows).
- `/api/media` — Presign upload/download, thumbnails.
- `/api/search` — Typesense-backed indexing and search.
- `/api/mod` — Moderation report/appeals, escalation.
- `/api/safety` — Messaging/CPF safety covered under `/api/msg`.

## SLOs and alerts
- **Availability**: 99.9% HTTP success rate per service.
- **Latency**: p95 < 500 ms for all REST endpoints.
- **Error budget**: 43m/month downtime budget.

Example PromQL:
```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service) > 0
histogram_quantile(0.95, sum(rate(http_request_duration_ms_bucket[5m])) by (le, service)) > 0.5
```

## Store release checklist
- Upload internal/beta tracks early; validate ANR and crash-free.
- Privacy policy and POPIA disclosures.
- Set up app signing, device coverage matrix, push notification entitlements.

## Ownership & contacts
- Product Owner: <name>
- Tech Lead: <name>
- SRE/Platform: <name>
- Security: <name>

## Notes on consolidation
- Retire Node `events-service` in production; maintain Python `events_service` as canonical. Consider folding agent7 endpoints into Super API over time.
