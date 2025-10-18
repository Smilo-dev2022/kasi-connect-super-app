# Week 7 (Days 43–49) – Dark Launch Expansion & Appeals Persistence

## Objectives
- Roll out beyond Ward 48 to additional wards
- Migrate appeals to SQL (Postgres) with admin views

## Scope Summary
- Focus: allowlist expansion; moderation DB cutover

## Owner Matrix (Agents)
| Agent | Area | Deliverable |
|------:|------|-------------|
| 12 | Moderation | MOD_DB_URL enabled; migrations and persistence |
| 5 | Data | Dashboards reflect new wards; SLOs held |

## Week Timeline (D43–D49)
- D43–D44: Enable MOD_DB_URL and data model
- D45–D46: Backfill appeals data; admin views polish
- D47–D49: Expand allowlist and monitor

## Exit Criteria
- Appeals survive restart; admin list filters by status
- No regressions in ward freshness SLOs
