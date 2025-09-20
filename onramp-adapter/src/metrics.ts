import { Counter, Histogram, register } from 'prom-client';

export const quoteCounter = new Counter({
  name: 'onramp_quote_requests_total',
  help: 'Total number of quote requests',
  labelNames: ['source_currency', 'target_currency'],
});

export const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 1.5, 2, 5],
});

export const collectDefaultMetrics = register.contentType;
export const getMetrics = register.metrics;
