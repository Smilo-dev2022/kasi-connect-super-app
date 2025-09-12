# Transparency Reports and Appeals Queue – Specification

## Goals
Provide public transparency on moderation and enforcement while giving users a fair, timely appeals process with auditability.

## Transparency Report (Public)
- Cadence: Monthly; dark launch includes v0 snapshot
- Metrics:
  - Total reports received by category and severity
  - Actions taken (warn, mute, suspend, remove)
  - Time to action (p50/p95)
  - Appeals submitted, outcomes, and time to resolution
  - Geographic/ward breakdown where appropriate
- Privacy: Aggregate, no PII; thresholds for small counts to avoid re-identification
- Publication: Website page with downloadable CSV; changelog of policy updates

## Appeals Queue (Internal)
- Intake: In-app form with reason, context, and optional attachment
- Routing: Auto-assign by category; SLA timers start at submission
- Roles: Reviewer, Supervisor, Auditor
- Workflow states: New → In Review → Need Info → Decision → Closed
- SLAs: p95 72 hours to decision; expedited for safety issues
- Audit log: Immutable record of actions and reasons

## Data Model (High-Level)
- Appeal: id, userId, contentId, category, submittedAt, status, decisionAt
- Decision: id, appealId, outcome, policyRefs[], reviewerId, notes
- Event: id, appealId, type, createdAt, actorId, payload

## Dashboards
- Queue size by state and age
- SLA breaches and upcoming deadlines
- Outcomes by category and reviewer

## Integrations
- Notifications: email/push on state changes
- Admin UI in web-admin for review and decisioning
- Export to public transparency aggregates

## Risks & Mitigations
- Sensitive data exposure → strict access control, redaction
- Bias in decision making → two-person review for certain categories
- Backlog growth → auto-prioritization and surge staffing protocol