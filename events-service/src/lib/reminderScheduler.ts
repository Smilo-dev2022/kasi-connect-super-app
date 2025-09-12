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
    const reminderMinutes = event.reminderMinutesBefore ?? 60;
    const reminderTime = dayjs(event.startsAt).subtract(reminderMinutes, 'minute');
    const windowStart = now.startOf('minute');
    const windowEnd = now.endOf('minute');
    if (reminderTime.isAfter(windowStart) && reminderTime.isBefore(windowEnd)) {
      console.log(
        `[Reminder] ${event.title} at ${event.startsAt} (in ${reminderMinutes} min)`
      );
    }
  }
}