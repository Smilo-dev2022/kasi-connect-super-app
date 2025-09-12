# Agent 9 - Search Service

TypeScript Fastify service providing basic metadata search for messages using Typesense or OpenSearch.

## Endpoints
- POST `/index/messages` body: `{ messages: MessageStub[] }`
- GET `/search?q=...&limit=20`

MessageStub fields: `id, from, to, scope, contentType?, timestamp, replyTo?, editedAt?, deletedAt?, tags?`.

## Run
1. Copy `.env.example` to `.env` and set credentials
2. Install deps: `npm i`
3. Dev: `npm run dev`

Switch driver via `SEARCH_DRIVER`.