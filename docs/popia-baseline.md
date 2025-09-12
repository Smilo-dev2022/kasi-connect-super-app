# POPIA Baseline Controls (Developer Preview)

This is a non-legal, developer-oriented checklist to move toward POPIA alignment.

- Lawfulness and purpose limitation: collect minimal identifiers (phone), consent via OTP flow UI.
- Data minimization: no plaintext messages on server; only libsignal ciphertext. Avoid storing OTPs post-verification.
- Security safeguards: enforce TLS in transit; at-rest encryption for databases and backups; role-based access for admin tools.
- Accountability: log access to sensitive endpoints, rotate secrets regularly.
- Data subject rights: implement export and deletion endpoints for user data.
- Retention: define retention policies for logs and message queues.
- Cross-border transfers: prefer regional hosting; document subprocessors.

Implementation next steps:
- Enforce HTTPS with issued certs; HSTS on web admin.
- Add DPA-ready data maps and incident response runbook.