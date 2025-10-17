# Week 4 (Days 22–28) – Events & Ward Freshness

## Objectives
- Events service (tickets/RSVP) and ward ingestion path
- Ward freshness API and admin table

## Scope Summary
- Focus: /api/metrics/ward ingest; /api/metrics/ward/freshness

## Owner Matrix (Agents)
| Agent | Area | Deliverable |
|------:|------|-------------|
| 5 | Events/Data | Ingest + freshness endpoints + metrics |
| 15 | Web Admin | Freshness table in dashboard |

## Week Timeline (D22–D28)
- D22–D24: Events + RSVP + tickets
- D25: Ward ingestion POST and persistence
- D26–D28: Freshness compute and admin view

## Exit Criteria
- Freshness endpoint returns healthy wards under 15m

## Links
- Events service (Python): ../events_service/app/main.py
- Web-admin dashboard: ../web-admin/app/page.tsx
