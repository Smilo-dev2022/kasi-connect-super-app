Push notifications – security hardening

Transport

- Use TLS to providers (APNs/FCM); verify provider endpoints.
- Rotate provider keys; store in secret manager; restrict IAM.

Payload hygiene

- No PII in payload; prefer minimal metadata (type, ids, collapse_id).
- Server-side localization; avoid sending user names if avoidable.
- For mentions, use generic body if required by UX.

Device hygiene

- Remove invalid tokens on Unregistered/InvalidToken errors promptly.
- Track last_seen and decay fanout to inactive devices.

Abuse prevention

- Rate-limit per user and per group; backoff on 5xx.
- Enforce mute/block lists server-side before fanout.

Monitoring

- Record success/failure codes; alert on spikes.
- Keep provider feedback loops enabled.

Client configuration

- iOS: set `apns-push-type`; use collapse ids; consider Notification Service Extension for media.
- Android: set proper priority; collapse_key; channel configuration with importance matching.

