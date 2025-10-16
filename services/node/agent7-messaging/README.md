# Agent 7 – Messaging service (E2EE, WS, groups)

This is a minimal Node.js + TypeScript messaging backend that supports:

- WebSocket connections for real-time delivery
- Token auth (JWT) for HTTP and WS
- User key registry endpoints to support end-to-end encryption (E2EE)
- Simple group management (create, add/remove members)
- Message relay for 1:1 and groups with in-memory persistence (dev/demo)

Important: This service does not perform server-side encryption or decryption. Clients are responsible for doing E2EE (e.g., Double Ratchet/Olm/Megolm). The server only stores and relays opaque ciphertext payloads.

## Quick start

1) Install dependencies

```bash
npm install
```

2) Set environment

```bash
cp .env.example .env
```

3) Develop

```bash
npm run dev
```

4) Build and run

```bash
npm run build
npm start
```

## Auth

Use JWTs with a `userId` claim. For quick local testing there is a dev endpoint to mint a token:

```http
POST /auth/dev-token { "userId": "alice", "name": "Alice" }
```

Then connect WS with the token as a header `Authorization: Bearer <token>` or query string `?token=...`.

## E2EE key registry

- `POST /keys/identity` Register identity public key and optional signed pre-key
- `POST /keys/prekeys` Upload a batch of one-time pre-keys
- `GET /keys/prekeys/:userId` Fetch and consume one pre-key for a recipient

These are lightweight shapes modelled with `zod`. Clients should sign/verify per their protocol.

## Groups

- `POST /groups` Create a group
- `POST /groups/:groupId/members` Add members
- `DELETE /groups/:groupId/members/:userId` Remove member
- `GET /groups/:groupId` Get group info

## WebSocket messaging

Client sends opaque ciphertext messages:

```json
{
  "type": "msg",
  "id": "uuid",
  "to": "bob", // userId or groupId
  "scope": "direct" | "group",
  "ciphertext": "...",
  "contentType": "application/octet-stream",
  "timestamp": 1710000000000
}
```

The server forwards to connected recipients and stores offline messages in memory for later fetch via HTTP:

- `GET /messages/since/:timestamp` to pull missed messages

This storage is volatile and for development only.

## Notes

- Replace JWT handling and storage with your production choices.
- Swap in a durable DB/queue for persistence and delivery guarantees.
- Implement real E2EE protocols (e.g., Signal Double Ratchet) on the client.