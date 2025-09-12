# UX Spec: CPF Safety Rooms

## Purpose
Provide a moderated, safety-focused real-time room where CPF members and residents coordinate during incidents.

## Core User Stories
- As a CPF moderator, I can enable Safety Mode to hold media for review before public visibility.
- As a resident, I can report an incident with optional location, media, and category.
- As a CPF member, I can mark an update as an alert to broadcast to ward dashboard.

## Room Modes
- Normal: messages post immediately.
- Safety Mode: attachments and location are queued for moderator approval; text posts with PII cues are flagged.

## Incident Reporting
- Quick action in composer: Report Incident.
- Fields: Category (Suspicious, Theft, Vandalism, Other), Location (current/pin), Media, Notes, Visibility (Room/Moderators only).

## Moderation Tools
- Approve/Reject queue with thumbnails, redactions preview (face/license plate blur).
- Slow mode: restrict posts to n per minute per user.
- Emergency banner: persistent alert with CTA to room.

## Privacy & Safety
- Default to hide phone numbers/addresses from non-mods; redact detected PII.
- Location sharing opt-in each time; timeout after 60 minutes.

## Acceptance Criteria
- Moderator can triage 10 items in ≤ 1 minute.
- Residents can submit an incident in ≤ 15 seconds.

