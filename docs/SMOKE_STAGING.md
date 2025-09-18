# Staging Smoke & Regression

Prereqs
- Staging services reachable (wallet/events/moderation/search/media/messaging)
- Export endpoints via env:
  - export VITE_WALLET_API=https://staging.api.example.com
  - export VITE_EVENTS_API=https://staging.events.example.com
  - export MOD_API=https://staging.mod.example.com

One-shot smoke
```bash
node scripts/smoke.mjs
```

Suggested regression (manual)
- Wallet: create → accept → pay; CSV export; balances update
- Events: list → RSVP with ticket → verify → check-in
- Moderation: report → escalate → close; metrics at /metrics
- Messaging: connect WS, send 1:1 message, verify delivery
- Media: presign upload → PUT object → presign/proxy get → thumb
- Search: index message → search by q and filters

Notes
- Ensure staging uses production flags: USE_DB=true, MOD_USE_DB=true, VITE_JWT_ONLY=true (frontend build-time)
- Verify CORS and HTTPS redirects are correct
- Confirm Prometheus /metrics endpoints respond 200