# Secrets Handling Guide

This guide describes how to manage secrets across services, how to load them in development, and how to provision them in production. Do not commit secrets to the repository.

## Principles
- Prefer a managed secret store (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) or HashiCorp Vault.
- Never commit `.env` files to source control.
- Rotate credentials regularly; short TTL where possible.
- Use least privilege IAM for any cloud keys.
- In production, services fail-fast if required secrets are missing.

## Loading Secrets (Development)
- Node services use `dotenv` and support a local `.env` file. Create one from `.env.example` and update values.
- Python services rely on environment variables. Use a `.env` with a process manager (e.g., `direnv`, `doppler`, `dotenvx`) or export variables in your shell.

## Loading Secrets (Production)
- Recommended: inject as environment variables at runtime from your secret manager.
- Kubernetes: mount secrets as env vars via `Secret` objects; restrict RBAC.
- Docker Swarm/Compose: use Docker secrets for file-based injection or an external sidecar (e.g., vault-agent) to template env files at start.

## Required Secrets by Service

### backend (Fastify)
- `JWT_SECRET` (required in production)
- `OTP_PEPPER` (required in production)
- `REDIS_URL`

### agent7-messaging (Express)
- `JWT_SECRET` (required in production)

### services/media (Express)
- `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (required in production)
- `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`
- `CORS_ORIGIN` (must not be `*` in production)

### agent9-search
- `TYPESENSE_API_KEY` (required in production)
- `TYPESENSE_PROTOCOL=https`

### events_service (FastAPI)
- `EVENTS_SECRET_KEY` (required in production)
- `EVENTS_DATABASE_URL`
- `EVENTS_BASE_URL` (should be https in production)

### Linear Integration
- Linear API key is stored in `.env.linear` at the repository root
- File format: `lin_api_<key>` (single line, no variable name)
- This file is automatically ignored by git to prevent accidental commits
- Used for project management integration with Linear

## Rotation
- Store the rotation runbook in `runbooks/rotate-secrets.md` (create if missing).
- Rotate on compromise or on a fixed cadence (90 days typical).

## Local .env files
- Place per-service `.env` near each service root.
- Never check in `.env` files; `.gitignore` them.

## Auditing
- CI should scan for plaintext secrets with `gitleaks` or `trufflehog`.