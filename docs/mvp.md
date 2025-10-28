### MVP Document — iKasiLink App (Final)

- **Version**: 1.0 (MVP)
- **Date**: 2025-10-17
- **Goal**: Ship a stable, privacy-conscious, community messaging and events MVP with ward-based groups, CPF safety rooms, basic media sharing, RSVPs, and transparency/appeals groundwork. Deliver dark-launch readiness and observability sufficient for GA ramp.

### 1) Scope

- **Mobile app (React Native)**: `iKasiLinkMobileApp/`
  - Tabs: Home/Dashboard, Events, Messages, Profile
  - Ward groups, CPF safety rooms, media attachments, RSVPs
- **Core backend services**
  - Messaging (Agent 7) WS + HTTP with JWT, E2EE key registry: `agent7-messaging/`
  - Events (Node) in-memory RSVPs: `events-service/`
  - Events/Wallet (FastAPI) with SQLite demo: `events_service/`
  - Media (S3/MinIO presign + thumbnails): `services/media/`
  - Moderation (reports + admin stub): `moderation_service/`
  - Super API gateway/dev stack: `super-api/`
- **Web admin**: basic admin surfaces (health, freshness, transparency groundwork)
- **Infra & ops**: Docker Compose dev, Helm deploys, Terraform skeleton in `infra/`, Prometheus scrape targets.

References:
- Project overview and local stack: `README.md`
- Service specifics: respective `README.md` files
- UX flows and wireframes: `ux/`

### 2) MVP Features

- **Onboarding & Auth**
  - OTP-based sign-in (scaffold; device key provisioning planned)
  - JWT-based API auth; client E2EE keys registry endpoints available
- **Messaging (1:1 and Groups)**
  - Real-time via WebSocket; in-memory offline fetch `GET /messages/since/:timestamp`
  - Groups: create, add/remove members, fetch info
  - Client-side E2EE assumed; server relays ciphertext only
- **Ward Groups Discovery**
  - Discover/Join public groups; create private groups with invite links
  - Basic roles: admin/member; content reporting hooks to Moderation
- **CPF Safety Rooms**
  - Verified CPF rooms with pinned guidelines
  - Admin post alerts; residents mark safe or request help
- **Media Sharing**
  - Images, short video, voice notes, documents
  - Presigned upload/download via Media service; thumbnails generation
  - Metadata stripping/warnings for privacy
- **Events & RSVPs**
  - CRUD events; RSVP create/list
  - Reminder scheduler (log-level)
  - SQLite demo UI in FastAPI; Node service for web integration
- **Transparency & Appeals groundwork**
  - Appeals/admin workflow spec; data model and dashboard outline
  - Public transparency metrics definition

### 3) Acceptance Criteria

- **Messaging**
  - Can mint dev token, connect WS, send/receive messages in 1:1 and group
  - Group create/add/remove works; messages pull via HTTP when offline
  - E2EE registry endpoints accept/serve keys; payloads remain opaque on server
- **Groups & Safety Rooms**
  - Discover/join public ward groups; create private groups
  - Safety room badge visible; admin can post an alert; resident can mark safe
- **Media**
  - Upload via presign PUT; download via presign or proxy
  - Thumbnail endpoint returns transformed image
  - Client shows progress and retry; rejects >20MB, compresses images/video
- **Events**
  - Create event; list; RSVP; see RSVPs for event
  - Reminder cron logs around scheduled minute
- **Moderation**
  - POST report accepted; queue transitions to in_review; admin stub reachable
- **Observability/Health**
  - Each service exposes `/health`; where available `/metrics`
  - Dashboards show latency/error rate; freshness dashboards for wards
- **Rollout Readiness**
  - Feature flags for dark launch; allowlist gates working
  - Rollback plan validated; smoke tests pass in staging
- **Compliance (POPIA baseline)**
  - Data inventory documented; privacy notice planned; DSR channels reachable

### 4) Non-Functional Requirements

- **Stability targets**
  - Crash-free sessions ≥ 99.5%, ANR < 0.47% during dark launch
- **Performance**
  - API p95 < 500ms on key endpoints (auth, messaging relay, RSVPs, media presign)
- **Security & Privacy**
  - TLS enforced; JWT auth; rate limiting/CORS in prod
  - Secrets via environment; at-rest encryption (S3 SSE/KMS) configurable
  - Client-side E2EE; server stores ciphertext only
  - Strip EXIF; warn on location sharing; minimize PI collection
- **Observability**
  - Structured logs; requestId/sessionId
  - Prometheus metrics exposed and scraped
  - Tracing via OpenTelemetry where available
- **Data retention**
  - OTP ephemeral; RSVP configurable; logs rotated; demo stores volatile

Sources:
- `docs/OBSERVABILITY.md`, `SECURITY.md`, `docs/POPIA_BASELINE.md`

### 5) Architecture Overview

- **Mobile app**: RN with path aliases, bottom tabs, FlashList chat, theme provider
- **Services**:
  - Messaging: Node TS, JWT, WS, groups, key registry (zod-validated)
  - Events: Node Express in-memory; FastAPI variant with SQLite and minimal UI
  - Media: S3/MinIO presign + thumbnail transform
  - Moderation: FastAPI reports/admin stub
  - Super API: shared dev gateway endpoints
- **Data flow**:
  - Mobile → Messaging WS for ciphertext; presign to Media → S3/MinIO
  - Events CRUD and RSVP via Events service; dashboard freshness feeds admin
  - Reports flow to moderation admin stub; transparency aggregates later

### 6) Rollout Plan

- **Dark Launch (Ward 48, Mbombela)**
  - Allowlist gates and feature flags; staged enablement per runbook
  - Health checks twice daily; rollback on breach
- **GA Ramp (Week of 15–19 Sep 2025)**
  - Stability triage and hotfixes early week
  - Internal store tracks uploaded; privacy/data safety completed
  - Ward dashboards freshness validated (<15 min)
  - Dry-run dark launch and rollback drill Fri; decision doc for next scope

References:
- `docs/dark-launch-runbook.md`, `docs/week-2025-09-15-ga-ramp.md`, `runbooks/crash-triage.md`, `runbooks/deploy-rollback.md`

### 7) Environment & Dev Setup

- Local stack: `docker compose -f docker-compose.dev.yml up --build`
- Web app dev server: `http://localhost:5173`
- Service endpoints exposed locally (see `README.md`)
- Mobile `.env` example (Android emulator):
  ```
  API_BASE_URL=http://10.0.2.2:8080
  SOCKET_URL=ws://10.0.2.2:8080
  SENTRY_DSN=
  ```
- Media stack: `docker compose -f docker-compose.media.yml up --build`

### 8) Risks and Mitigations

- **App store delays**: Upload internal tracks early; complete data safety forms
- **Stability regressions**: Feature flags, canaries, rollback drills
- **Data freshness gaps**: Retries/backoff; alert on lag >15 min; manual ingestion
- **E2EE maturity**: Server is relay-only; client protocol integration staged
- **Volatile storage in dev**: Documented; plan DB migrations for prod services

### 9) Open Items (Post-MVP)

- Persist messaging and moderation queues in durable stores
- Implement full appeals persistence and admin UI in web-admin
- Push hardening and device matrix coverage
- Privacy Notice publication and DPA formalization
- Expand telemetry with tracing across all services
