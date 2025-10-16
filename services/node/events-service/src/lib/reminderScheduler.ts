import dayjs from 'dayjs';
import { reminderRuns, reminderDuration } from './metrics';
import { listEvents } from './storage';

let intervalHandle: NodeJS.Timeout | null = null;

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