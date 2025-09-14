import dayjs from 'dayjs';
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
  const now = dayjs();
  const events = listEvents();
  for (const event of events) {
    const startsAt = dayjs(event.startsAt);
    const windows = [
      { label: '24h', time: startsAt.subtract(24, 'hour') },
      { label: '2h', time: startsAt.subtract(2, 'hour') },
    ];
    const windowStart = now.startOf('minute');
    const windowEnd = now.endOf('minute');
    for (const w of windows) {
      if (w.time.isAfter(windowStart) && w.time.isBefore(windowEnd)) {
        console.log(`[Reminder ${w.label}] ${event.title} at ${event.startsAt}`);
      }
    }
  }
}