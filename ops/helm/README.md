# Helm charts

Top-level chart at `ops/helm/top` installs:
- Traefik ingress
- cert-manager with ClusterIssuer
- A base Ingress rule example

Add per-service subcharts under `ops/helm/<service>` including:
- Deployment, Service, HPA, PDB, ConfigMap, Secret refs
- Probes: liveness `/health`, readiness `/metrics` if applicable
- Resource requests/limits and `securityContext` with non-root users
- Optional Job templates for DB migrations