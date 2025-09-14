import client, { Counter, Histogram } from 'prom-client';

// Use default global registry so all modules contribute to one /metrics
client.collectDefaultMetrics();

export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'method', 'route', 'status'] as const,
});

export const httpRequestDurationMs = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['service', 'method', 'route', 'status'] as const,
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
});

export const reminderRuns = new client.Counter({
  name: 'reminder_runs_total',
  help: 'Reminder job runs',
  labelNames: ['window'] as const,
});

export const reminderDuration = new client.Histogram({
  name: 'reminder_job_duration_ms',
  help: 'Reminder job duration ms',
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000],
});

export const rsvpTotal = new client.Counter({
  name: 'rsvp_total',
  help: 'Total RSVPs created',
});

export const checkinTotal = new client.Counter({
  name: 'checkin_total',
  help: 'Total check-ins',
});

export const registry = client.register;

