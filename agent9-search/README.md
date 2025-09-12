# Agent 9 – Search Service

Fastify service providing basic full-text search over message metadata using Typesense.

## Endpoints

- GET /health
- POST /messages/index — index a single message stub
- GET /messages/search — query messages by `q`, optional filters: `type`, `conversation_id`, `sender_id`; pagination: `page`, `per_page`

## Local development

Use the docker-compose in `spikes/turn-setup` (if Docker is available):

```bash
docker compose -f ../../spikes/turn-setup/docker-compose.yml up --build -d
```

Without Docker (Typesense not running): build and start the service anyway to validate it boots:

```bash
cd /workspace/agent9-search
npm i
npm run build
node dist/src/index.js
```

Seed data (requires Typesense running):

```bash
cd /workspace/agent9-search && npm run seed
```

Test search (requires Typesense running):

```bash
curl "http://localhost:4009/messages/search?q=hello&per_page=5"
```

## Environment

- TYPESENSE_HOST (default: localhost)
- TYPESENSE_PORT (default: 8108)
- TYPESENSE_PROTOCOL (default: http)
- TYPESENSE_API_KEY (default: xyz)
- PORT (default: 4009)