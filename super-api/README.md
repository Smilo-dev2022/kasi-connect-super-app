Super API

- REST base: `/`
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
