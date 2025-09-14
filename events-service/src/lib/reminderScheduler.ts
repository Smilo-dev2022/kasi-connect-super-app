import dayjs from 'dayjs';
import client, { Registry, Counter, Histogram } from 'prom-client';
import { listEvents } from './storage';

let intervalHandle: NodeJS.Timeout | null = null;
const registry: Registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
const reminderRuns = new client.Counter({ name: 'reminder_runs_total', help: 'Reminder job runs', labelNames: ['window'] as const, registers: [registry] });
const reminderDuration = new client.Histogram({ name: 'reminder_job_duration_ms', help: 'Reminder job duration ms', buckets: [5,10,25,50,100,250,500,1000,2000], registers: [registry] });

export function startReminderScheduler(): void {
  if (intervalHandle) return;
  intervalHandle = setInterval(checkAndLogReminders, 60 * 1000);
  // Run once at startup
  checkAndLogReminders();
}

export function stopReminderScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

function checkAndLogReminders(): void {
  const endTimer = reminderDuration.startTimer();
  const now = dayjs();
  const events = listEvents();
  for (const event of events) {
    const startsAt = dayjs(event.startsAt);
    const windowStart = now.startOf('minute');
    const windowEnd = now.endOf('minute');
    const t24 = startsAt.subtract(24, 'hour');
    const t2 = startsAt.subtract(2, 'hour');
    if (t24.isAfter(windowStart) && t24.isBefore(windowEnd)) {
      reminderRuns.labels({ window: '24h' }).inc();
      console.log(`[Reminder-24h] ${event.title} at ${event.startsAt}`);
    }
    if (t2.isAfter(windowStart) && t2.isBefore(windowEnd)) {
      reminderRuns.labels({ window: '2h' }).inc();
      console.log(`[Reminder-2h] ${event.title} at ${event.startsAt}`);
    }
  }
  endTimer();
}