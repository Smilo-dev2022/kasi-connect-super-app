# Dark Launch Runbook – Ward 48 and Mbombela

## Purpose
Execute a limited-visibility rollout in Ward 48 and Mbombela to validate stability, data freshness, and operational readiness with real users.

## Preconditions
- Candidate builds available on internal tracks (Play) and TestFlight
- Feature flags prepared for ward allowlisting and remote kills
- Dashboards for crash rate, ANR, latency, sign-in, and key flows
- On-call schedule and escalation matrix confirmed
- Community launch kits shared with ward leaders, stokvels, CPF

## Change Controls
- Rollout via server allowlist (wards, user ids, or geo)
- App store staged rollout 5–10% optional for broader internal expansion
- All changes tracked in change log with timestamps and operator

## Schedule
- Day 39: Enable Ward 48 allowlist at 10:00; monitor for 24 hours
- Day 41: Enable Mbombela allowlist at 10:00; monitor for 24 hours
- Twice-daily health checks 10:00 and 16:00

## Health Metrics and SLOs
- Crash-free sessions ≥ 99.5%; ANR < 0.47%
- API p95 latency < 500 ms on key endpoints
- Dashboard data freshness < 15 minutes
- Sign-in success ≥ 98%; push delivery success ≥ 95%

## Observability
- Dashboards: Mobile stability, API latency, Events freshness, Adoption funnels
- Alerts: Threshold breaches paging mobile/backend on-call
- Logs: Structured with requestId/sessionId; sampled at ≥ 10%

## Run Steps
1) Pre-flight (T-60 min)
   - Validate flags default safe; kill switches functional
   - Check candidate build metrics for last 24 hours
   - Confirm dashboards green and alerting armed
2) Rollout (T+0)
   - Add Ward 48 to allowlist; verify client sees features within 5 minutes
   - Smoke test: sign-in, messaging, payments, dashboards
3) Monitoring (T+0 to T+180)
   - Watch crash/ANR deltas; review logs for spikes
   - Verify ward dashboard ingests events within 15 minutes
4) Incident Handling
   - P0: Roll back allowlist immediately; enable kill switches; postmortem
   - P1: Fix-forward behind flag; hotfix if needed
5) Expansion
   - After 24h stable, enable Mbombela allowlist and repeat

## Rollback Plan
- Remove wards from allowlist; set features to off by default
- Revert staged rollout in stores to previous stable
- Server-side disable risky features via flags

## Communications
- Internal: #launch-ward48, #launch-mbombela channels
- External: Ward leader messaging and FAQs from launch kits
- Status updates at T+1h, T+4h, EOD

## Artifacts to Capture
- Graphs of key metrics before/after
- Incident tickets and resolutions
- Lessons learned for Week 7 rollout