# Push notifications: payloads and collapse strategy

## Registration

POST `/devices` with `{ platform: ios|android|web, token }`. One row per unique `(user_id, token)`.

- Store `platform`, token, and `last_seen_at` on each app open.
- Unregister via DELETE `/devices/{id}` on logout or token revoke.

## Event types

- message.created
- group.member_added
- group.member_removed
- group.updated (name/photo)

## Payload format

Common envelope fields:

```json
{
  "type": "message.created",
  "group_id": "g_123",
  "message_id": "msg_789",
  "title": "Design Team",
  "body": "Alex: check this out",
  "badge": 5,
  "collapse_id": "grp:g_123"
}
```

Platform mapping:

- iOS (APNs):
  - `apns-topic`: app bundle id
  - `apns-push-type`: `alert`
  - `apns-expiration`: 600
  - `apns-collapse-id`: `collapse_id`
  - `mutable-content`: 1 if using Notification Service Extension for rich media
- Android (FCM):
  - `collapse_key`: `collapse_id`
  - `priority`: `high` for mentions, otherwise `normal`
  - `ttl`: 600s

## Collapse strategy

- Use `collapse_id = "grp:{group_id}"` for new message fanout.
- This ensures multiple messages coalesce to one notification per group if device is offline.
- For mentions (`@username`) or replies-to-user, set high priority and optionally distinct `collapse_id = "mention:{group_id}"`.

## Fanout rules

- Exclude recipients who have blocked the sender or are blocked by the sender.
- Suppress notifications for users who muted the group (`group_members.is_muted = 1`).
- Safety rooms may default to `alert`=quiet unless mentioned.

## Badge counts

- Maintain per-user unread counts server-side per group.
- Badge is the sum across groups, capped (e.g., 999+ on client side).

## Rich content (optional)

- Include `image` url for thumbnails where platforms support it.
- iOS: Use a Notification Service Extension to fetch thumb and attach. This can land later.

## Error handling

- Remove device rows on `Unregistered`/`InvalidToken` responses.
- Backoff on 5xx from push providers; retry with jitter.

## Security

- Do not put PII in payload body. Keep content minimal.
- Localize `title` and `body` on the server using user locale if available.
- Store device tokens encrypted at rest in production. Restrict access by role.
- Scope service credentials (APNs/FCM) per environment; never reuse prod keys in dev.
- Validate device ownership on registration (e.g., short-lived attestation or signed nonce).
- Implement token hygiene: delete on logout, rotate on provider errors, backoff with jitter.
- Prefer data-only pushes with client-side fetch when feasible to minimize payload exposure.