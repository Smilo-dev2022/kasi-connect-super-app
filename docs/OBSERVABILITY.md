# Observability and SLOs

This document outlines the observability strategy for the project.

## Dashboards
- TODO: Create dashboards for onramp, KYC, and payouts.
- TODO: Key metrics to track:
  - Onramp: success rate, quote-to-order ratio, partner latency.
  - KYC: approval rate, time to approve/reject.
  - Payouts: success rate, time to complete.

## Alerts
- TODO: Set up alerts for:
  - High error rates on all services.
  - Webhook lag between `onramp-adapter` and `wallet-service`.
  - High quote miss rate (quotes that don't convert to orders).
  - P1 alerts should page the on-call engineer.

## Tracing
- TODO: Ensure all requests have a unique `request_id` that is propagated across services.
- TODO: Traces should be linked to runbooks for easy debugging.
