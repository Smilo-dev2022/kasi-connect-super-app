# Wireframe: Basic Chat Screen

Goal: Lightweight, safe-by-default chat for ward, groups, and CPF safety rooms.

## Header

```
┌ [<]  CPF Safety Room – Ward 68      [⋮]
└ Participants: 124  |  Live Alert: Off
```

## Message List

```
 [Pinned] Safety tips: Do not share personal info.
 ───────────────────────────────────────────────
 19:04  |  @CPF-Mod: Reported incident at Park Ave. Details?
 19:05  |  @ResidentA: Saw two individuals in blue sedan.
 19:06  |  Image: sedan.jpg  [Tap to view]
 19:07  |  @CPF-Mod: Share plate privately to mod.
```

- System messages: join/leave, room mode changes
- Read receipts optional for CPF rooms (privacy)

## Composer

```
[ + ]  [ Type a message ]  [ Mic ]  [ Send ]
```

- Plus menu: Photo, Video, Location, Document, Report Issue
- Safety mode in CPF rooms: media reviewed before public posting (toggle)

## Attachments Viewer

```
┌ Image viewer with pinch-zoom, save, forward to group
└ Blur faces (optional toggle)
```

---

## Edge Cases
- Media moderation queue in CPF rooms
- Rate limit to prevent spam; slow-mode for large rooms
- Offline: queue messages; clear failed state with retry

## Acceptance Criteria
- Send text/media in ≤ 2 taps; accessibility labels included
- CPF room safety mode prevents PII leakage by default

