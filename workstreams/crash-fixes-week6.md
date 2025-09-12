# Week 6 Crash/ANR Fixes Tracker

Targets
 - Crash-free sessions ≥ 99.3%
 - ANR rate < 0.30%
 - Reduce top 5 crash clusters by ≥ 80%
 - No new P0s within 24h after rollout

Owners
 - Agents 1–4 (engineering), Release manager (rollouts), QA lead (verification)

Workflow
 - Prioritize by user impact and critical path (onboarding, payments, dashboards)
 - Assign a single DRI per issue with ETA and verification plan
 - Use canary rollout (10% → 50% → 100%) and monitor hourly

Top Clusters (template)
| Rank | Fingerprint/Title | Severity | Owner | ETA | Status | Version | Notes |
|---|---|---|---|---|---|---|---|
| 1 | <hash> NullPointer in OnboardingStepView | P0 | Agent 1 | 2025-09-13 16:00 | Investigating | 1.0.36 | affects Android 12/13 |
| 2 | <hash> ANR Input dispatch timeout | P0 | Agent 2 | 2025-09-13 18:00 | Reproduced | 1.0.36 | high on low-end devices |
| 3 | <hash> Crash in DashboardFragment on start | P1 | Agent 3 | 2025-09-14 12:00 | Fix in PR | 1.0.37 | regression from PR #1234 |
| 4 | <hash> OOM during image decode | P1 | Agent 4 | 2025-09-14 17:00 | Profiling | 1.0.36 | add downsampling |
| 5 | <hash> SSLHandshakeException | P1 | Agent 2 | 2025-09-15 10:00 | Mitigated via retry | 1.0.36 | check TLS config |

Verification Checklist (per issue)
 - Unit/Integration tests updated
 - Targeted reproduction test on affected OS/devices
 - Canary build validated at 10% for 1–2 hours
 - Metrics back to baseline

Rollout Log
 - 2025-09-13 11:00: Hotfix-001 submitted to Internal Testing
 - 2025-09-13 14:00: Hotfix-001 to Beta 10% (Android)
 - 2025-09-13 16:00: Observing metrics; no new P0s

