# iKasiLink – MVP Document

**Version**: 1.0 (MVP)

**Date**: 17 October 2025

---

## Objective
Deliver a stable, privacy-conscious, township-focused messaging and events platform with ward-based groups, CPF safety rooms, media sharing, RSVPs, and transparency groundwork. The release targets dark-launch readiness and full observability for GA ramp.

---

## 1. Scope

### Mobile App (React Native)
- Tabs – Home, Events, Messages, Profile
- Ward groups and CPF safety rooms
- Media attachments and RSVPs

### Core Backend Services
- Messaging (Agent7) – WebSocket + HTTP, JWT, E2EE key registry
- Events (Node) – In-memory RSVPs
- Events/Wallet (FastAPI) – SQLite demo
- Media (Node) – S3/MinIO presign + thumbnails
- Moderation (FastAPI) – Reports + admin stub
- Super API Gateway – Unified REST + metrics
- Web Admin – Health, freshness, transparency groundwork

### Infrastructure
- Docker Compose (dev), Helm deploys, Terraform skeleton, Prometheus metrics.

### References
- [`README.md`](../README.md)
- Service READMEs
- UX wireframes

---

## 2. MVP Features

### Onboarding & Auth
- OTP login; JWT auth
- E2EE key registry (client-managed)

### Messaging
- Real-time 1:1 & group chat (WS)
- Offline fetch via HTTP `/messages/since/:timestamp`
- Create, add/remove group members
- Server relays ciphertext only

### Ward Groups
- Public group discovery, private invites
- Roles: admin/member
- Reporting hooks to Moderation

### CPF Safety Rooms
- Verified CPF channels
- Alerts by admin; residents mark “safe” or “need help”

### Media
- Presigned upload/download
- Thumbnails & compression
- Privacy: EXIF strip, warning on location share

### Events & RSVPs
- Create, list, RSVP
- Reminder scheduler
- SQLite demo UI

### Transparency & Appeals
- Appeals model & admin outline
- Public metrics foundation

---

## 3. Acceptance Criteria

### Messaging
- ✅ Dev token mint → WS connect → send/receive
- ✅ Group CRUD + offline sync
- ✅ E2EE keys handled; ciphertext opaque

### Safety & Groups
- ✅ Public discovery, private join
- ✅ CPF alert posts + safe/unsafe responses

### Media
- ✅ Presign upload/download
- ✅ Thumbnails render
- ✅ 20MB limit, compression enforced

### Events
- ✅ CRUD + RSVP + reminder logs

### Moderation
- ✅ Report POST accepted; admin reachable

### Observability
- ✅ `/health` + `/metrics` for all services
- ✅ Dashboards show latency/error

### Rollout
- ✅ Dark launch feature flags
- ✅ Rollback validated

### Compliance
- ✅ POPIA baseline, privacy docs prepared

---

## 4. Non-Functional Requirements
- **Stability**: Crash-free ≥99.5%, ANR <0.47%
- **Performance**: p95 latency <500 ms
- **Security**: JWT auth, TLS, rate limit, CORS
- **Privacy**: Strip EXIF, minimize PII
- **Observability**: Prometheus + OpenTelemetry
- **Data Retention**: Ephemeral OTP, rotating logs

### References
- [`docs/OBSERVABILITY.md`](./OBSERVABILITY.md)
- [`SECURITY.md`](../SECURITY.md)
- [`docs/POPIA_BASELINE.md`](./POPIA_BASELINE.md)

---

## 5. Architecture Overview

### Frontend
- React Native app with tab navigation, FlashList chat, theming.

### Backend Services
- Messaging: Node + WS + JWT + Redis + Zod
- Events: Node + FastAPI hybrid
- Media: MinIO S3 + Sharp
- Moderation: FastAPI + SQLModel
- Super API: Fastify + Prisma + Swagger
- Admin: Next.js dashboard

### Data Flow
- Client → Messaging WS → Media → S3
- Events → RSVP → Dashboard → Transparency metrics

---

## 6. Rollout Plan

### Dark Launch (Ward 48 – Mbombela)
- Feature flags, allowlist gates
- Health checks twice daily
- Rollback on breach

### GA Ramp (Week 15–19 Sept 2025)
- Fixes early week; data safety complete
- Dashboards validate freshness (<15 min)
- Dry-run + rollback drill
- Decision doc for next scope

### References
- [`docs/dark-launch-runbook.md`](./dark-launch-runbook.md)
- [`docs/week-2025-09-15-ga-ramp.md`](./week-2025-09-15-ga-ramp.md)
- [`docs/crash-triage-sop.md`](./crash-triage-sop.md)
- [`docs/deploy-rollback.md`](./deploy-rollback.md)

---

## 7. Environment & Dev Setup

```bash
docker compose -f docker-compose.dev.yml up --build
```

- Web: `http://localhost:5173`

### Mobile .env (Android)
```env
API_BASE_URL=http://10.0.2.2:8080
SOCKET_URL=ws://10.0.2.2:8080
SENTRY_DSN=
```

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| App store delay | Upload internal track early |
| Stability regression | Canary flags + rollback drills |
| Data lag | Retries, alerts on >15 min lag |
| E2EE maturity | Relay-only until client protocol ready |
| Volatile dev storage | Plan DB migrations for prod |

---

## 9. Open Items (Post-MVP)
- Persistent messaging + moderation queues
- Appeals admin UI
- Push notifications + device matrix
- Privacy notice + DPA formalization
- Full tracing + service-level telemetry
