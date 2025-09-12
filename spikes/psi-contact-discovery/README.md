## Spike: Private contact discovery with PSI (Agents 6 + 13)

Goal: Prototype a privacy-preserving contact discovery flow so clients can find which contacts are registered without revealing their full address book to the server.

Approach candidates
- OPRF-based set intersection (client blinds identifiers; server applies PRF with secret key; client unblinds, compares)
- Bloom filter or Cuckoo filter with salted/peppered hashing as a lower-security baseline for comparison

Deliverables
- Design note comparing OPRF-based PSI vs hashed-filter baseline (correctness, privacy, ops cost)
- Minimal runnable demo (CLI) for one approach (start with baseline), with inputs: client list, server list; output: intersection
- API sketch for server endpoint(s) and client flow, including rate limiting and abuse mitigations

Out of scope
- Production-ready cryptography; this is for feasibility and API shape

References to integrate later
- User identities and prekeys live in `agent7-messaging/src/state.ts`

How to proceed
1) Start with a baseline demo: normalize phone/email identifiers; hash with server-provided pepper; compare via filter or hashed set.
2) Evaluate an OPRF PSI library or implement a toy OPRF over a safe curve using an existing library.
3) Document trade-offs and decide next step.

