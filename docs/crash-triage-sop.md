# Crash Triage SOP and Dashboards Specification

## Goals
Reduce P0/P1 crashers quickly, maintain crash-free sessions ≥ 99.5%, and provide clear ownership and visibility across teams.

## Severity Levels
- P0: App not usable for majority; widespread crash loop or login failure
- P1: Major feature unusable; high-frequency crash in common path
- P2: Moderate impact; specific devices or flows
- P3: Low impact; rare edge cases

## Intake Sources
- Play Console Vitals (ANR, crash rate, top exceptions)
- Firebase/Crashlytics/Sentry issue feeds
- iOS Xcode Organizer crash logs
- User reports via support/helpdesk

## Triage Cadence
- Realtime page for P0/P1; within 15 minutes acknowledgment
- Twice daily review for P2/P3
- Weekly retrospective of resolved issues and regressions

## Ownership
- Mobile platform leads own triage rotation and assignment
- Feature owners fix and verify
- QA verifies reproduction and regression tests

## Process
1. Detect and classify severity
2. Assign owner and create ticket with reproduction steps and stack traces
3. Reproduce locally or via device farm; capture logs
4. Mitigate: feature flag, server kill switch, or hotfix
5. Verify fix in canary/internal track; monitor for regression
6. Postmortem for P0 with action items

## Dashboards Spec
- Crash-free sessions by platform, version, device model
- Top crashers with trend and first seen
- ANR rate by version and device
- Release health: adoption, sessions, errors per session
- Filters: ward allowlist cohorts, CPF/stokvel cohorts
- Alerts: threshold breaches and unusual spikes

## Instrumentation
- Add breadcrumbs on auth, messaging, payments, dashboard view
- Correlate with requestId/sessionId
- Ensure crashes include app version, build number, device and OS

## SLAs
- P0: mitigate ≤ 60 minutes; hotfix ≤ 4 hours
- P1: mitigate ≤ 4 hours; fix ≤ 24 hours
- P2: fix ≤ 3 business days
- P3: fix ≤ 2 weeks

## Reporting
- Daily digest to #stability with new, resolved, SLA breaches
- Weekly summary with top regressions and improvement plan