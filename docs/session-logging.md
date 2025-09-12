Session logging – privacy-preserving defaults

Principles

- Collect minimal metadata necessary for security and reliability.
- Avoid content logging; never store message bodies in logs.
- Redact identifiers where feasible; hash stable IDs with salt.

Schema (example)

```
event_time: timestamp
event_type: auth.login | session.refresh | ws.connect | ws.disconnect
user_hash: sha256(user_id || salt)
device_id: opaque client device identifier
ip_prefix: /24 or /48 prefix, not full IP
user_agent: truncated UA string
session_id: short-lived session handle (no secrets)
result: success | failure
reason: invalid_credentials | expired | network | other
```

Guidelines

- Use structured logs (JSON) and rotate; set retention bounds.
- Separate security logs from application logs; restrict access.
- Ensure time sync; include monotonic timestamps where possible.
- Provide request correlation IDs across services.

Redaction

- Apply redaction middleware for headers and query params.
- Whitelist-safe headers only; mask Authorization, Cookies.

Access and audit

- Limit access by role; maintain audit trails for log access.

