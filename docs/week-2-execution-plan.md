# Week 2 (Days 8–14) – Core API: Groups, Media, Push

## Objectives
- Deliver Week 2 API surface and DB schema
- Media pre-signed upload flow and thumbnailing
- Push registration endpoints stable

## Scope Summary
- Focus: Groups/Members/Messages CRUD + search
- Milestone: Week 2 OpenAPI live; schema deployed

## Owner Matrix (Agents)
| Agent | Area | Deliverable |
|------:|------|-------------|
| 1–2 | API + DB | Endpoints match `spec/openapi.yaml` |
| 5 | Data | Message index (FTS5) online |
| 8 | Media | Upload URL + thumb + HLS |

## Week Timeline (D8–D14)
- D8: Create groups, add members, message list/send
- D9–D10: Media: upload-url, complete, thumb, HLS
- D11: Search + FTS5 sync triggers
- D12–D14: Harden auth, pagination, error handling

## Exit Criteria
- OpenAPI passes smoke; CRUD and media paths exercised
- Search returns expected results; FTS in sync

## Links
- OpenAPI: ../spec/openapi.yaml
- DB schema: ../db/schema.sql
