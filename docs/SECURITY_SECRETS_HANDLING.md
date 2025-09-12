## Secrets handling

This document defines baseline practices for managing secrets (API keys, tokens, passwords, private keys) across services.

Baseline requirements
- Use environment variables for all secrets; never hard-code secrets in code.
- Store production secrets only in a managed secret store (e.g., AWS Secrets Manager, SSM Parameter Store, Vault). Do not store secrets in source control.
- Restrict secret scope by service; do not reuse the same secret across services.
- Rotate secrets at least every 90 days or immediately upon suspicion of compromise.
- Enforce least privilege on IAM roles/users that access secrets.
- Log access to secrets at the secret manager level. Do not log actual secret values.

Local development
- Use a local `.env` file and keep it out of Git. Example templates are provided as `.env.example` in each service.
- Use placeholder values for non-sensitive dev secrets.

Runtime loading
- Node services: load via `dotenv` in config modules only; do not call `dotenv.config()` in many places.
- Python services: use pydantic-settings or `os.environ` and pass values through dependency injection.

Transport security
- Always transmit secrets over TLS (HTTPS) only.
- Do not embed secrets in URLs; prefer headers.

Process and storage
- Never write secrets to logs, analytics, or crash reports.
- Avoid printing environment variables in diagnostics.
- For generated keys (JWT, crypto), store in a secret store; avoid long-lived static defaults.

Rotation procedure (high level)
1. Introduce new secret alongside the old one (dual-read period).
2. Deploy all services to read the new secret.
3. Flip writers to use the new secret.
4. Remove old secret after stability window.

Incident response
- If a secret is leaked, rotate immediately, invalidate tokens/keys derived from it, and review logs for abuse.

