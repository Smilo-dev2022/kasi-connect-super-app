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


// Ward metrics: track last event timestamps per ward in-memory for MVP
type WardFreshnessRecord = {
  ward: string;
  last_event_at: string; // ISO timestamp
};

const wardLastEventMap: Map<string, string> = new Map();

export function recordWardEvent(ward: string, time?: Date) {
  const t = (time ?? new Date()).toISOString();
  wardLastEventMap.set(ward, t);
}

export function getWardFreshness(): WardFreshnessRecord[] {
  const now = Date.now();
  return Array.from(wardLastEventMap.entries())
    .map(([ward, iso]) => {
      const ts = Date.parse(iso);
      const ageSeconds = Math.max(0, Math.round((now - ts) / 1000));
      return { ward, last_event_at: iso, age_seconds: ageSeconds, healthy: ageSeconds <= 15 * 60 } as any;
    })
    .sort((a, b) => a.ward.localeCompare(b.ward));
}

