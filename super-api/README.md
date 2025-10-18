Super API

- REST base: `/`
- Unified proxies: `/api/wallet`, `/api/media`, `/api/search`, `/api/mod`, `/api/msg`, `/api/events`
- WS namespace: `/ws/chat`
- Docs: `/docs`
- Health: `/health`
- Metrics: `/metrics`

Dev:
- Install: `npm -w super-api i`
- Build: `npm -w super-api run build`
- Start: `PORT=8081 npm -w super-api run start`
- Compose: `docker compose -f super-api/docker-compose.dev.yml up -d`

Smoke:
- `npm -w super-api run smoke`
