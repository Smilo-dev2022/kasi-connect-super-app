# Crash Triage Playbook (Week 6)

Purpose
 - Rapidly detect, triage, and resolve crash and ANR issues during Week 6 dark launch.
 - Ensure clear ownership, SLAs, and repeatable workflow with rollback safety.

Scope
 - Android and iOS production, beta, and internal testing builds.
 - Crashlytics/Sentry, Google Play Vitals (ANR), App Store Connect metrics.

Cadence
 - Daily triage: 10:00–10:30 local time (Africa/Johannesburg)
 - EOD status: 17:30 quick sync; update dashboard and issue statuses
 - Bridge for P0 incidents: open within 5 minutes of detection

Roles
 - On-call engineer (Agents 1–4, rotating): primary responder, owns P0/P1 assignments
 - Incident coordinator (PM/Lead): comms, status board, stakeholder updates
 - Release manager: hotfix coordination, phased rollout, rollback authority

SLAs
 - P0: acknowledge < 15m, owner assigned < 60m, mitigation < 4h, fix < 24h
 - P1: acknowledge < 60m, owner assigned < 2h, fix < 72h
 - P2+: plan within backlog; do not block dark launch unless trend worsens

Tools
 - Crashlytics: crash clusters, crash-free sessions
 - Google Play Console: ANR rate, Play Vitals
 - Sentry: release health, performance issues
 - Status board: project tracker (single source of truth)
 - Slack: #incidents (alerts), #eng (status), #launch (stakeholders)

Detection & Alerting
 - Alerts fire to #incidents when any of the following breach thresholds:
   - Crash-free sessions < 99.3% over last 2 hours
   - ANR rate > 0.30% over last 2 hours
   - New P0 cluster appears or top cluster count increases > 50% in 2 hours

Triage Workflow (Daily)
 1) Pull top N clusters (N=10) by users affected and rate
 2) Identify top 5 by business impact (onboarding, payment, dashboard critical paths)
 3) For each, capture: fingerprint, app version, device OS, reproduction hints, suspected code area
 4) Assign single owner with ETA; link to work item; set severity (P0/P1)
 5) Define verification plan (logs, canary build, experiment flag)
 6) Update status board; communicate highlights in #eng

Hotfix & Rollout Workflow
 - Branch: release/<date>-hotfix-<short-id>
 - CI: run full checks + targeted tests for affected modules
 - Store rollout: phased 10% -> 50% -> 100% with 1–2 hour observation windows
 - Post-release: monitor hourly for 24h; hold if new P0 appears

Rollback Criteria
 - Any P0 persists > 1 hour after hotfix rollout begins
 - Crash-free sessions drop below 98.5% at any point
 - ANR rate spikes > 0.50% over 1 hour
Action: halt rollout, flip remote flags, revert to last known good build, announce via comms runbook

Data Hygiene
 - Ensure symbol uploads/dSYMs mapping completeness for all builds
 - Keep release notes precise; include issue IDs fixed

Templates
 - Triage record (paste into issue):
   ```yaml
   triage:
     date: 2025-09-12
     severity: P0
     fingerprint: <hash>
     versions_affected: [1.0.36, 1.0.37]
     devices: [Android 12, Android 13]
     users_affected_estimate: 4.2%
     suspected_area: onboarding:identity, network:timeouts
     owner: <agent name>
     eta_fix: 2025-09-13 16:00
     verification: canary 10% + logs
     rollback_ready: true
     links:
       crashlytics: <url>
       play_vitals: <url>
       sentry: <url>
       pr: <url>
   ```

On-Call Handover Checklist
 - Review open P0/P1, confirm owners, ETAs
 - Validate alerts are green/quiet or acknowledged
 - Note any canary rollouts or pending rollbacks
 - Update status board before end of shift

