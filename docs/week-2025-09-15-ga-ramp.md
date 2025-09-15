# Week of 15–19 Sep 2025 – GA Ramp Plan (MVP Focus)

## Objectives (This Week)
- Hit stability targets on candidate builds (crash/ANR) with hotfixes
- Submit internal tracks (Play/TestFlight) and complete privacy/data safety
- Validate ward dashboards and data freshness paths end-to-end (< 15 min)
- Dry-run dark launch flow (allowlist + feature flags) with smoke tests

## Owners (DRIs)
- Agents 1–4: Crash/ANR triage and hotfixes
- Agent 7: Runtime stability, watchdogs, ANR mitigation
- Agent 5: Ward dashboards, metrics ingestion, freshness
- Agent 12: Transparency & Appeals MVP (admin surface; persistence plan)
- Agent 14: Store submissions and rollout plans
- Agent 15: Community launch kits readiness (stakeholder comms)

## Cadence
- Daily stand-up 10:00 (15 min) – focus on crash deltas, store blockers, dashboards
- Health checks: 10:00 and 16:00 – metrics, incidents, rollback readiness
- End-of-day status notes in #launch-week7

## Plan by Day

### Mon 15 Sep
- Environment
  - Verify dark launch gates are enabled behind FEATURE_FLAGS=dark_launch; configure ALLOWLIST_WARDS="Ward 48"
  - Set NEXT_PUBLIC_EVENTS_API_BASE and NEXT_PUBLIC_MOD_API_BASE for web-admin
- Instrumentation
  - Ensure ward ingestion endpoint POST /api/metrics/ward is called by seed/sim scripts
  - Prometheus scrape configured for messaging, events, moderation services
- Deliverables
  - Health endpoints green; metrics exposed; basic admin pages reachable

### Tue 16 Sep
- Stability & Crash Triage (Agents 1–4, 7)
  - Identify top 5 crash clusters; assign DRIs; write repro + verification
  - Land ≥2 hotfix PRs; expand tests on critical flows (auth, groups, safety rooms)
- Deliverables
  - Crash/ANR dashboard shows downward trend; PRs merged; pre-launch report checked

### Wed 17 Sep
- Store Internal Tracks (Agent 14)
  - Android: build .aab, upload to Play Internal Testing; complete Data safety, content rating
  - iOS: archive + upload to TestFlight; App Privacy + export compliance
  - Add reviewer notes + demo creds; screenshots minimal set
- Deliverables
  - Builds available on internal tracks; privacy/data safety complete in consoles

### Thu 18 Sep
- Ward Dashboards & Freshness (Agent 5)
  - Validate end-to-end ingestion → freshness API → web-admin page
  - Threshold set to 15 min; alerts on breach (page Agent 5)
- Appeals MVP (Agent 12)
  - Minimal admin list view in web-admin; finalize persistence approach for next week
- Deliverables
  - Freshness table shows live wards; SLO met; alert tested

### Fri 19 Sep
- Dark Launch Dry Run
  - Enable allowlist for Ward 48 in staging; run smoke: sign-in, messaging, payments, dashboards
  - Run rollback drill (disable allowlist + flags)
- Go/No-Go Prep
  - Known issues list; next-week plan for persistence (appeals), push hardening, device matrix
- Deliverables
  - Dry-run report; decision doc for next week scope

## Exit Criteria (End of Week)
- P0/P1 crash clusters reduced by ≥40% week-over-week
- Internal tracks live (Play/TestFlight); privacy/data safety forms completed
- Ward freshness < 15 min sustained; alert tested; admin page displays healthy
- Dark launch dry-run executed with documented rollback and smoke results

## Risks & Mitigations
- App review delays → Internal tracks early, complete reviewer notes and demo creds
- Regressions from hotfixes → Canary, feature flags, rollbacks tested Thu/Fri
- Data freshness gaps → retries/backoff, alert on lag > 15 min, manual ingestion fallback

## Links
- Dark Launch Runbook: ./dark-launch-runbook.md
- Store Submission Checklists: ./store-submission-checklists.md
- Week 6 Plan (prior): ./week-6-execution-plan.md