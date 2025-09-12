POPIA baseline – Day 1

Purpose

Establish an initial compliance baseline aligned with the Protection of Personal Information Act (POPIA) to guide design and operations.

Roles and responsibilities

- Information Officer: oversees compliance, incident response, and data subject requests.
- Engineering: implements privacy by design and data security controls.
- Support: handles data access/correction/deletion requests.

Lawful processing and minimality

- Collect only necessary personal information for messaging operations.
- Define purposes in privacy notice; avoid incompatible secondary use.

Data inventory (template)

- System/service: name
- Data elements: e.g., phone, email, device token, public key, message metadata
- Purpose: authentication, routing, push notifications, analytics (if any)
- Storage location: DB/table/bucket
- Retention: duration and deletion policy
- Access: roles with least privilege

Security safeguards

- TLS in transit; E2E where applicable; hashing for identifiers where feasible.
- Secrets management and key rotation.
- Access controls and audit logging with data minimization.

Data subject rights

- Access, correction, deletion requests handled within statutory timelines.
- Provide contact method and verification process.

Breach notification

- Detect, assess severity, notify Information Regulator and affected subjects as required.
- Maintain incident log and post-incident remediation plan.

International transfers

- Ensure adequate protection where data flows across borders; use model clauses as needed.

Change management

- Privacy impact assessment for new features; update data inventory and notices.

