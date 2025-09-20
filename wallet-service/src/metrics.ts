import { Counter, Histogram, register } from 'prom-client';

export const onrampOrderCounter = new Counter({
  name: 'wallet_onramp_orders_total',
  help: 'Total number of on-ramp orders created',
  labelNames: ['partner'],
});

export const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5],
});

export const collectDefaultMetrics = register.contentType;
export const getMetrics = register.metrics;
