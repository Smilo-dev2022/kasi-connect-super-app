# Wallet Service (Day 1 Skeleton)

Lightweight Node/TypeScript + Express + Prisma service for wallet accounts and transactions with a placeholder API and mobile-friendly balance stream.

## Stack
- Node.js + TypeScript
- Express 5
- Prisma ORM (SQLite)
- Swagger UI (basic placeholder)

## Quickstart

1) Install

```bash
cd wallet-service
npm install
```

2) Database (SQLite) and Prisma Client

```bash
# Already migrated in this skeleton; if you need to reset:
npx prisma migrate dev --name init
```

3) Dev

```bash
npm run dev
# server on :3001
```

4) Build + Start

```bash
npm run build
npm start
```

## Endpoints

- Health
  - GET `/health`

- Accounts
  - POST `/api/accounts` body: `{ displayName?: string, ownerId?: string }`
  - GET `/api/accounts`
  - GET `/api/accounts/:id`
  - GET `/api/accounts/:id/balance` -> `{ accountId, balanceCents, currency }`

- Transactions
  - POST `/api/transactions` body: `{ accountId: string, type: 'CREDIT' | 'DEBIT', amountCents: number, currency?: string, description?: string, metadata?: any }`
  - GET `/api/transactions/by-account/:accountId`

- SSE Stream (mobile balance UI)
  - GET `/api/stream/balance/:accountId`
  - Server-Sent Events stream. Emits on connect and whenever a transaction posts for the account:
    - `data: { accountId, balanceCents, currency }\n\n`

- Swagger UI (placeholder)
  - GET `/docs`

## CORS
CORS is enabled with permissive default (`origin: true`) for mobile/local development.

## Smoke Test (curl)

```bash
# Create account
curl -s -X POST http://localhost:3001/api/accounts \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"Main Wallet","ownerId":"user_1"}'

# List accounts
curl -s http://localhost:3001/api/accounts

# Replace with your created account id
ACCOUNT_ID=REPLACE_ME

# Credit transaction
curl -s -X POST http://localhost:3001/api/transactions \
  -H 'Content-Type: application/json' \
  -d '{"accountId":"'"$ACCOUNT_ID"'","type":"CREDIT","amountCents":5000,"description":"Top-up"}'

# Balance
curl -s http://localhost:3001/api/accounts/$ACCOUNT_ID/balance

# List transactions
curl -s http://localhost:3001/api/transactions/by-account/$ACCOUNT_ID
```

## Mobile Integration (SSE balance)

Example React Native (or web) using EventSource polyfill:

```javascript
import { EventSourcePolyfill } from 'event-source-polyfill';

const accountId = 'YOUR_ACCOUNT_ID';
const es = new EventSourcePolyfill(`http://localhost:3001/api/stream/balance/${accountId}`, {
  headers: { Accept: 'text/event-stream' },
});

es.onmessage = (evt) => {
  const payload = JSON.parse(evt.data);
  // payload = { accountId, balanceCents, currency }
  console.log('balance update', payload);
};

es.onerror = (e) => {
  console.warn('sse error', e);
  es.close();
};
```

Notes:
- Balance emits immediately on connect, then after each transaction on the account.
- Use HTTPS and proper origin controls in production.

## Project Structure

```
src/
  index.ts            # server bootstrap
  prisma.ts           # Prisma client
  routes.ts           # route wiring + swagger ui
  routes/
    accounts.ts       # accounts CRUD + balance
    transactions.ts   # create/list
    sse.ts            # balance SSE + notifier
prisma/
  schema.prisma       # Account + Transaction models
```

## Data Model
- Account: `id`, `displayName?`, `ownerId?`, timestamps
- Transaction: `id`, `accountId`, `type` (CREDIT|DEBIT), `amountCents`, `currency`, optional `description`, `metadata`, timestamp

## Next Steps
- AuthN/Z (scoped by `ownerId`)
- Idempotency keys for transaction writes
- OpenAPI per-route annotations
- Pagination and filtering for listings
- Multi-currency support and FX handling