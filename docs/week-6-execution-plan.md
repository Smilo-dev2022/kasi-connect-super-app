# Week 6 (Days 36–42) – Beta & Launch: Plan and Owner Matrix

## Objectives
- Resolve top crashers and ship hotfixes to stabilize beta builds
- Prepare and submit builds to Google Play and Apple App Store
- Onboard CPF and stokvel cohorts with clear materials and support
- Publish transparency reports and stand up appeals queue
- Enable ward dashboards and validate data freshness and accuracy
- Deliver dark launch in Ward 48 and Mbombela

## Scope Summary
- Focus: crash fixes, store prep, CPF + stokvel onboarding
- Milestone: Dark launch limited to Ward 48 and Mbombela

## Owner Matrix (Agents)
| Agent | Area | Deliverable |
|------:|------|-------------|
| 1–4 | Bug fixes, crash reports | Triage top crashers, ship fixes, close crash loops |
| 5 | Ward dashboards | Dashboards live with ward-level metrics, data freshness < 15 min |
| 7 | Stability | Runtime stability improvements, watchdogs, ANR mitigation |
| 12 | Transparency & Appeals | Public transparency report + internal appeals queue live |
| 14 | Store Submissions | Google Play and App Store submissions and phased rollout |
| 15 | Community Launch Kits | Kits for ward leaders, stokvels, CPF + training |

Cross-functional owners
- Android/iOS leads: mobile readiness, signing, release management
- Backend lead: API stability, rate limits, observability SLOs
- Data/Analytics: crash dashboards, adoption funnels, ward metrics
- QA: test plans, smoke/regression on hot paths
- Infra/SRE: alerts, on-call, rollback and feature flag control
- Comms/Support: announcements, runbooks, escalation paths

## Week Timeline (D36–D42)
- D36: Lock crash-fix scope; enable feature flags in staging; prepare store assets
- D37: Submit to internal testing tracks (Play, TestFlight); complete privacy forms
- D38: Verify crash drops; bake time; dashboards validation; finalize launch kits
- D39: Staged rollout 5–10% internal cohorts; appeals queue soft open
- D40: Expand to Ward 48 allowlist; monitor; fix-forward if needed
- D41: Expand to Mbombela allowlist; publish transparency report v0
- D42: Stabilization buffer; go/no-go review for broader beta

## Exit Criteria (Dark Launch)
- P0/P1 crashers reduced by ≥60% vs previous week
- ANR rate < 0.47% Android; Crash-free sessions ≥ 99.5% iOS
- Ward dashboards show events within 15 minutes of occurrence
- Appeals queue operational with SLA timers and audit log
- Store submissions accepted; phased rollout enabled; rollback plan tested

## Meetings & Cadence
- Daily 15-min stand-up: focus on crash deltas, store blockers, rollout status
- Twice-daily health check: 10:00 and 16:00 local for metrics and incidents
- Go/No-Go checkpoints: D39 PM, D41 PM

## Links
- Dark Launch Runbook: ./dark-launch-runbook.md
- Store Submission Checklists: ./store-submission-checklists.md
- Crash Triage SOP: ./crash-triage-sop.md
- Transparency & Appeals Spec: ./transparency-appeals-spec.md
- Community Launch Kits: ./community-launch-kits.md
- Ward Dashboards (Agent 5): add URL once deployed

## Risks & Mitigations
- App review delays: submit early, provide reviewer notes and demo creds
- Crash re-introductions: protect with canary, staged rollout, server kill switches
- Data freshness gaps: backfill job retries, alert on lag > 15 minutes
- Onboarding confusion: provide scripts, FAQs, and contact paths in launch kits

## Approvals
- Security/Privacy review complete for store disclosures
- Legal/sign-off for transparency report scope
- Product sign-off for dark launch entry/exit criteria

