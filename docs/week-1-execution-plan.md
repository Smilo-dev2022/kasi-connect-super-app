# Week 1 (Days 1–7) – Foundations: Auth, Keys, Environments

## Objectives
- OTP signup flow reachable (dev) and device key provisioning stubbed
- Core repos scaffolded; CI running; basic observability in place
- Environments defined (dev/staging) with secrets strategy

## Scope Summary
- Focus: Auth OTP, device registration, repo/CI wiring
- Milestone: Sign-in flows working end-to-end in dev

## Owner Matrix (Agents)
| Agent | Area | Deliverable |
|------:|------|-------------|
| 1–2 | Auth backend | OTP endpoints, rate-limits, JWT issued |
| 3 | Mobile setup | iOS/Android builds; device token capture |
| 7 | Messaging bootstrap | WS skeleton; health checks |
| 12 | Security | Secrets plan; threat checklist |

## Week Timeline (D1–D7)
- D1–D2: Repos, CI, basic health endpoints; define ENV and secrets
- D3–D4: OTP request/verify; JWT issuance; device registration data model
- D5: Mobile app shells; capture APNs/FCM tokens locally
- D6–D7: Wire web-admin skeleton; add dashboards placeholders

## Exit Criteria
- OTP request/verify returns JWT in dev; rate-limits enforced
- Device registration endpoint persists tokens
- CI green; /health up; /metrics exposed on services

## Links
- Crash Triage SOP: ./crash-triage-sop.md
- Store Submission Checklists: ./store-submission-checklists.md
- Dark Launch Runbook (future): ./dark-launch-runbook.md
