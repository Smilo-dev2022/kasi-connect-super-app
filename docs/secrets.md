Secrets handling – development baseline

Scope

- Prevent committing credentials; centralize configuration in environment variables or secret stores.
- Adopt lightweight local scanning; optionally enforce pre-commit hooks.

Guidelines

- Never commit secrets to git. Use `.env` locally; keep `.env.example` for required keys.
- Prefer short‑lived tokens and least privilege. Rotate credentials regularly.
- Use per‑developer dev credentials; avoid sharing long‑lived tokens.
- For services, load secrets from environment and support `FILE:` indirection, e.g., `DB_PASSWORD_FILE`.

Local checklist

- `.gitignore` ignores `certs/` and `.env*`.
- Run `scripts/secret-scan.sh` before pushing.
- Optionally install pre-commit with gitleaks or detect-secrets for CI enforcement.

Env variable conventions

- Use `*_FILE` variants to read a value from a file path when available.
- Use `*_SECRET` suffix for sensitive keys.
- Avoid printing env to logs; redact values.

Incident response (dev)

- If a secret is committed: remove from history, rotate the credential, and invalidate tokens.
- File a brief postmortem and update patterns in secret scanners if needed.

