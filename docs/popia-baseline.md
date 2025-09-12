# POPIA baseline

## Scope
This document outlines baseline controls for personal data processed by the project.

## Lawful basis
- Contract and legitimate interests for messaging features
- Consent where required for notifications

## Personal data categories
- Account identifiers and device tokens
- Message metadata (not content) for delivery and abuse prevention

## Retention
- Logs: 30 days by default for operational needs
- Device tokens: until logout or token revoke

## Data subject rights
- Access, correction, deletion, portability upon verified request
- Contact: privacy@localhost

## Security controls
- Encryption in transit with TLS for all services
- Minimal payloads in notifications; avoid PII in bodies
- Secrets via env files in dev and a KMS in prod
- Access controls and audit trails for admin operations

## Breach response
- Triage within 24 hours, notify impacted users and authorities per law

## Roles
- Responsible party: project owner
- Operators: on-call engineers
