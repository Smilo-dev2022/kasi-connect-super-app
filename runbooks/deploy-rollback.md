# Deploy and Rollback

## Deploy (Kubernetes)
- Ensure images are pushed with the desired tag.
- Set `global.imageTag` in `ops/helm/values.yaml` (or use `-f` overrides per env).
- Apply:
```bash
helm upgrade --install kc ops/helm -n prod -f ops/helm/values.yaml \
  --set global.imageRegistry=ghcr.io \
  --set global.imageRepository=your-org/kasi-connect \
  --set global.imageTag=vX.Y.Z
```

## Rollback
```bash
helm rollback kc <REVISION>
```

## Database Migrations
- For Python `events_service`: bake Alembic migration jobs or run `alembic upgrade head` before rollout.
- For Node `events-service`: run `npm run migrate` against the production DB.

## Health Checks
- Confirm liveness/readiness probes are green.
- Check `/metrics` endpoints where available.

## Post-Deploy
- Verify logs and alerts.
- Run `scripts/smoke.mjs` against the environment.
