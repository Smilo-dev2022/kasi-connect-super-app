## Wallet Service (Agent 10)

Minimal wallet service skeleton with Accounts and Transactions models, placeholder APIs, and mobile integration hooks (balance + SSE).

### Quickstart

1) Install deps
```bash
npm install
```

2) Configure env
```bash
cp .env.example .env
# (optional) edit PORT or ALLOWED_ORIGINS
```

3) Generate client and run migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

4) Run
```bash
npm run dev
# or
npm run build && npm start
```

Health check: `GET /health` -> `{ ok: true }`

### Data Models (Prisma)
- Account: `id`, `userId`, `balance`, `currency`, timestamps
- Transaction: `id`, `accountId`, `amount`, `type` (CREDIT|DEBIT), `description?`, `balanceAfter`, `createdAt`

### API

Base path: `/api`

- Accounts
  - `GET /api/accounts` — list accounts
  - `POST /api/accounts` — create account
    - body: `{ userId: string, currency?: string }`
  - `GET /api/accounts/:id` — get account

- Transactions
  - `GET /api/transactions` — list all
  - `GET /api/transactions/account/:accountId` — list by account
  - `POST /api/transactions` — create transaction
    - body: `{ accountId: string, amount: number, type: 'CREDIT'|'DEBIT', description?: string }`

### Mobile Integration Hooks

- Balance (single fetch)
  - `GET /api/mobile/balance/:userId`
  - Response: `{ balance: number, currency: string, accountId: string }`

- Balance stream (SSE)
  - `GET /api/mobile/balance/stream/:userId`
  - Headers set for SSE; emits new balance on change.

Example iOS (URLSession) and Android (OkHttp) can listen for events; set `ALLOWED_ORIGINS` for CORS if on web.

### Docker

Build and run:
```bash
docker build -t wallet-service .
docker run --rm -it -p 3000:3000 --env-file .env wallet-service
```

### Notes
- SQLite for local dev; swap provider and `DATABASE_URL` for Postgres/MySQL in prod.
- SSE uses naive polling; replace with DB change notifications or a message bus later.
