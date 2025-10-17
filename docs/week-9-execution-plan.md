# Week 9 (Days 57–63) – Scale & Caching

## Objectives
- Add caching layers and background jobs where needed
- Optimize hot paths in messaging/events

## Scope Summary
- Focus: cache keys, pagination, N+1 fixes

## Owner Matrix (Agents)
| Agent | Area | Deliverable |
|------:|------|-------------|
| 5 | Data | Cache strategy and invalidation |
| 7 | Messaging | Throughput improvements; WS tuning |

## Week Timeline (D57–D63)
- D57–D59: Identify hot paths; add cache
- D60–D61: Background jobs and retries
- D62–D63: Load tests and fixes

## Exit Criteria
- P95 latencies improved ≥30% on key endpoints
