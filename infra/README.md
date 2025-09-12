# Infra

Terraform stubs for Postgres, Redis, Scylla, and S3. Providers and modules to be added during implementation.

## TLS via Caddy (dev/prod baseline)

Example `Caddyfile` to terminate TLS and proxy services:

```
{
	email you@example.com
}

example.com {
	encode gzip
	log
	@webadmin path /admin/*
	reverse_proxy @webadmin 127.0.0.1:5173

	@api path /ws /auth/* /keys/* /groups/* /messages/* /safety/* /media/* /devices/* /receipts/*
	reverse_proxy @api 127.0.0.1:8080
}

events.example.com {
	encode gzip
	reverse_proxy 127.0.0.1:8081
}
```

## Key Transparency scope

Baseline implemented: client key registration and pre-key retrieval via `agent7-messaging` (`/keys/*`).

Next steps:
- Append-only log of key changes (Signed Tree Head) via a simple Merkle log service.
- Periodic STH gossip between admin/web clients.
- Audit endpoint to fetch historical keys and STH proofs.
