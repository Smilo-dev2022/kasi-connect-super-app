# Local setup

Prerequisites: Node 20+, npm 10+, Docker (optional for local DBs).

## Steps

1. Copy `.env.example` to `.env` at repo root.
2. Start local infra (once `docker-compose.yml` exists): `docker compose up -d`
3. Backend:
   - `cd backend`
   - `npm install`
   - `npm run dev`
4. Web-admin:
   - `cd web-admin`
   - `npm install`
   - `npm run dev`

Mobile shells will be added later. See `infra/terraform` for cloud infra skeleton.

