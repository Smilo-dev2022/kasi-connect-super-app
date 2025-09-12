## Spike: MLS groups prototype (Agents 7 + 13)

Goal: Evaluate feasibility of Messaging Layer Security (MLS) for our group messaging flows and produce a minimal prototype showing group key establishment and message encryption/decryption integrated conceptually with `agent7-messaging`.

Non-goals: Production security. This is a learning/prototyping spike.

Deliverables
- Short notes on library options and trade-offs (OpenMLS via WASM, MLS++, or stopgap symmetric simulation)
- Runnable local prototype that simulates MLS-like group encryption over our existing `groupId` concept
- Decision: go/no-go for a deeper MLS integration, with identified blockers and next steps

Context in repo
- Server groups API: `agent7-messaging/src/groups.ts`
- WebSocket delivery: `agent7-messaging/src/ws.ts`
- Message log/read: `agent7-messaging/src/messages_http.ts`

Prototype
- A small Node script `prototype.mjs` that simulates group key management and AES-GCM encryption/decryption using an in-memory key store keyed by `groupId`. This stands in for MLS just to prove the end-to-end flow and payload shape.

Run locally
```bash
node spikes/mls-groups/prototype.mjs
```

What you should see
- The script creates a test group, encrypts a message, then decrypts it, printing both the ciphertext envelope and the recovered plaintext.

Next steps after this spike
- If the flow is acceptable, replace the simulated crypto with a real MLS library and define a client/server protocol for committing group changes (adds/removes) and delivering MLS Welcome messages/Commits.
- Define serialization for MLS ciphertext and how it maps into our existing WebSocket envelope fields.

Notes on libraries (to investigate)
- OpenMLS (Rust) compiled to WASM for use in JS/TS clients
- MLS++ (C++) potential bindings
- State of JS-native MLS is evolving; a short evaluation is part of this spike

