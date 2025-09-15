# POPIA Baseline (Protection of Personal Information Act)

This baseline maps our controls to POPIA principles and identifies personal information (PI) processed by the system. It is a living document owned by Security & Compliance.


## Scope and Data Inventory

- Data subjects: end-users, event attendees, admins.
- Systems in scope: `backend`, `agent7-messaging`, `services/media`, `agent9-search`, `events_service`, mobile apps, web-admin.
- Personal Information (PI):
  - Identifiers: user ID, device tokens, RSVP name, RSVP email.
  - Contact info: email, phone (if collected for OTP).
  - Usage metadata: IP addresses, timestamps, logs.
  - Media uploads: user-submitted content which may contain PI.



## Operators and Roles

- Responsible party: Company legal entity.
- Operators: Cloud providers, SMS/Email providers, storage providers (e.g., S3/MinIO), search provider (Typesense), analytics where applicable.



## POPIA Principles Mapping

- Accountability: SECURITY.md references governance, incident response, and DPA management.
- Processing limitation: Collect minimum PI required for authentication and RSVP; no special categories.
- Purpose specification: OTP for authentication; RSVP for event attendance; media uploads for user features; search indexing for UX.
- Further processing limitation: No secondary use without consent; anonymize for analytics where possible.
- Information quality: Input validation across APIs; rate limiting to reduce abuse.
- Openness: Privacy Notice to be published in product and website; link from web-admin.
- Security safeguards: TLS in transit; encryption options at rest (S3 SSE/KMS); role-based access; rate limiting; secret management.
- Data subject participation: Provide access, correction, and deletion channels via support email and in-app controls (see DSR section).



## Lawful Basis and Consent

- Authentication OTP: consent to receive OTP via selected channel.
- RSVP: performance of a contract (event attendance management).



## Data Subject Rights (DSR)

- Access, correction, deletion: via support request or in-app endpoints where available.
- Export: CSV export available for RSVPs; extendable to user data.
- Contact: [privacy@ikasilink.co.za](mailto:privacy@ikasilink.co.za)



## Retention

- OTP codes: ephemeral, deleted after verification or expiry.
- RSVP and ticketing: retained for event operations; configurable retention window.
- Logs: minimum necessary; rotate and expire per operational policy.



## Security Controls

- HTTPS enforced via reverse proxy; HSTS enabled in production.
- Security headers enabled (Helmet/Fastify-Helmet).
- Secrets management documented; services fail-fast if missing secrets in production.
- Rate limiting on public endpoints.
- CORS restricted in production.
- Optional S3 SSE or KMS configured by environment.



## Cross-Border Transfers

- If data is stored or processed outside the RSA, ensure appropriate safeguards and contractual clauses with operators.



## Breach Response

- See `SECURITY.md` incident response. Notify Information Regulator and affected data subjects per statutory timelines where applicable.



## DPIA Trigger Points

- Introduction of new high-risk processing (e.g., biometrics, location tracking).
- Large-scale profiling or automated decision making.



## Open Actions

- Publish Privacy Notice and link within apps.
- Formalize operator agreements and DPAs.
- Log data inventory in CMDB (owner: Security).
