## POPIA baseline (South Africa Protection of Personal Information Act)

Scope
- Applies to processing of personal information of South African data subjects by these services.

Roles and responsibilities
- Responsible party: The company running this system.
- Operators: Cloud providers and third-party processors used (e.g., AWS, Typesense, messaging providers).

Lawful processing principles (high-level controls)
- Accountability: Appoint an information officer; maintain a data processing register.
- Processing limitation: Collect minimum necessary data; obtain consent or another lawful basis; limit purpose.
- Purpose specification: Document purposes in privacy notice; set data retention periods per data category.
- Further processing limitation: Evaluate compatibility before secondary use; require DPA for third parties.
- Information quality: Validate inputs; allow data subjects to correct errors.
- Openness: Publish privacy policy and PAIA manual; provide contact details for requests.
- Security safeguards: Enforce TLS, strong auth, encryption at rest where possible; least privilege; logging and monitoring; incident response plan.
- Data subject participation: Provide mechanisms to access, correct, and delete data; handle objections.

Technical baseline controls in this repo
- TLS enforcement available via `ENFORCE_HTTPS=true` in all HTTP services.
- Security headers via Helmet (Express) and @fastify/helmet (Fastify); HSTS enabled by default via TLS terminator and/or redirect middleware.
- CORS configured to least privilege in production; default `*` for local dev only.
- Rate limiting present in Fastify and FastAPI services where applicable.
- Secrets not committed; `.env` are gitignored; see `docs/SECURITY_SECRETS_HANDLING.md`.

Data mapping (examples)
- Identity/contact data: phone/email for OTP; RSVP name/email.
- Device data: push tokens; platform info.
- Operational logs: non-PII by default; avoid storing sensitive payloads.

Retention baseline (suggested)
- OTP artifacts: <= 15 minutes.
- Logs: 30–90 days depending on severity.
- RSVP/events: per business need; define per-table policies in DBA docs.

Third parties and cross-border transfers
- Assess adequacy; sign DPAs; implement SCCs where applicable.

Incident response
- Notify information regulator and affected data subjects when required; follow company IR plan.

Requests from data subjects
- Provide contact email; respond within statutory timelines; require identity verification.

Change management
- Security and privacy impact assessment for new features processing PII.

