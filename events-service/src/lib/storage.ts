import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';
import {
  Event,
  EventSchema,
  NewEventInput,
  NewEventInputSchema,
  UpdateEventInput,
} from '../models/event';
import {
  Rsvp,
  RsvpSchema,
  NewRsvpInput,
  NewRsvpInputSchema,
  UpdateRsvpInput,
} from '../models/rsvp';

const dataDir = path.resolve(process.cwd(), 'data');
const eventsFile = path.join(dataDir, 'events.json');
const rsvpsFile = path.join(dataDir, 'rsvps.json');

function ensureDataDirSync(): void {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch {}
}

function atomicWriteFileSync(filePath: string, data: string): void {
  ensureDataDirSync();
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, data);
  fs.renameSync(tmpPath, filePath);
}

function readJsonArrayFileSync<T>(filePath: string): T[] {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
    return [];
  } catch {
    return [];
  }
}

let events: Event[] = [];
let rsvps: Rsvp[] = [];

function loadDataSync(): void {
  const rawEvents = readJsonArrayFileSync<any>(eventsFile);
  const validatedEvents: Event[] = [];
  for (const item of rawEvents) {
    const parsed = EventSchema.safeParse(item);
    if (parsed.success) validatedEvents.push(parsed.data);
  }
  events = validatedEvents;

  const rawRsvps = readJsonArrayFileSync<any>(rsvpsFile);
  const validatedRsvps: Rsvp[] = [];
  for (const item of rawRsvps) {
    const parsed = RsvpSchema.safeParse(item);
    if (parsed.success) validatedRsvps.push(parsed.data);
  }
  rsvps = validatedRsvps;
}

function saveEventsSync(): void {
  atomicWriteFileSync(eventsFile, JSON.stringify(events, null, 2));
}

function saveRsvpsSync(): void {
  atomicWriteFileSync(rsvpsFile, JSON.stringify(rsvps, null, 2));
}

// Load once on module import
loadDataSync();

export function listEvents(): Event[] {
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getEventById(eventId: string): Event | undefined {
  return events.find((e) => e.id === eventId);
}

export function createEvent(input: NewEventInput): Event {
  const parsed = NewEventInputSchema.parse(input);
  const nowIso = new Date().toISOString();
  const event: Event = EventSchema.parse({
    id: uuidv4(),
    createdAt: nowIso,
    ...parsed,
  });
  events.push(event);
  saveEventsSync();
  return event;
}

export function updateEvent(eventId: string, input: UpdateEventInput): Event {
  const existing = events.find((e) => e.id === eventId);
  if (!existing) {
    throw new Error('Event not found');
  }
  const nextStartsAt = input.startsAt ?? existing.startsAt;
  const nextEndsAt = input.endsAt ?? existing.endsAt;
  if (nextEndsAt && dayjs(nextEndsAt).isBefore(dayjs(nextStartsAt))) {
    throw new Error('endsAt must be after startsAt');
  }
  const updated: Event = EventSchema.parse({
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  });
  const idx = events.findIndex((e) => e.id === eventId);
  if (idx !== -1) {
    events[idx] = updated;
  }
  saveEventsSync();
  return updated;
}

export function deleteEvent(eventId: string): boolean {
  const index = events.findIndex((e) => e.id === eventId);
  if (index === -1) return false;
  events.splice(index, 1);
  // Cascade delete RSVPs
  for (let i = rsvps.length - 1; i >= 0; i--) {
    const item = rsvps[i];
    if (item && item.eventId === eventId) {
      rsvps.splice(i, 1);
    }
  }
  saveEventsSync();
  saveRsvpsSync();
  return true;
}

export function listRsvps(filter?: { eventId?: string }): Rsvp[] {
  if (filter?.eventId) {
    return rsvps.filter((r) => r.eventId === filter.eventId);
  }
  return [...rsvps];
}

export function getRsvpById(rsvpId: string): Rsvp | undefined {
  return rsvps.find((r) => r.id === rsvpId);
}

export function createRsvp(input: NewRsvpInput): Rsvp {
  const parsed = NewRsvpInputSchema.parse(input);
  const event = getEventById(parsed.eventId);
  if (!event) {
    throw new Error('Event does not exist');
  }
  const nowIso = new Date().toISOString();
  const rsvp: Rsvp = RsvpSchema.parse({
    id: uuidv4(),
    createdAt: nowIso,
    ...parsed,
  });
  rsvps.push(rsvp);
  saveRsvpsSync();
  return rsvp;
}

export function updateRsvp(rsvpId: string, input: UpdateRsvpInput): Rsvp {
  const index = rsvps.findIndex((r) => r.id === rsvpId);
  if (index === -1) {
    throw new Error('RSVP not found');
  }
  const existing = rsvps[index]!;
  const updated: Rsvp = RsvpSchema.parse({
    ...existing,
    ...input,
    updatedAt: new Date().toISOString(),
  });
  rsvps[index] = updated;
  saveRsvpsSync();
  return updated;
}

export function deleteRsvp(rsvpId: string): boolean {
  const index = rsvps.findIndex((r) => r.id === rsvpId);
  if (index === -1) return false;
  rsvps.splice(index, 1);
  saveRsvpsSync();
  return true;
}