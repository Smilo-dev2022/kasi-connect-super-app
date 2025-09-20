# Observability Bootstrap

- Ensure all services expose `/health` for probes.
- Prefer JSON structured logs to stdout; aggregate via cloud logging.
- Expose `/metrics` where available (e.g., `events-service` using Prometheus client) and scrape in the cluster.
- Add tracing via OpenTelemetry SDKs; export to Jaeger/Tempo/X-Ray.
- Create dashboards for latency, error rate, saturation, and business KPIs.
