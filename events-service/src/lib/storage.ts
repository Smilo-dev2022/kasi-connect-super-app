// storage for events/rsvps/tickets (in-memory for dev/demo)
import dayjs from 'dayjs';
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
import { Ticket } from '../models/ticket';
import { v4 as uuidv4 } from 'uuid';
import { pool, query } from './db';

const events: Event[] = [];
const rsvps: Rsvp[] = [];
const tickets: Ticket[] = [];

export function listEvents(): Event[] {
  if (pool) {
    // For brevity, prefer in-memory for listing in this scaffold; DB path can be added
  }
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function getEventById(eventId: string): Event | undefined {
  return events.find((e) => e.id === eventId);
}

export function createEvent(input: NewEventInput): Event {
  const parsed = NewEventInputSchema.parse(input);
  const nowIso = new Date().toISOString();
  const id = uuidv4();
  const event: Event = EventSchema.parse({ id, createdAt: nowIso, ...parsed });
  if (pool) {
    // best-effort insert
    void query(
      'INSERT INTO events (id, title, description, location, starts_at, ends_at, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING',
      [id, event.title, event.description ?? null, event.location ?? null, event.startsAt, event.endsAt ?? null, nowIso]
    );
  }
  events.push(event);
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
  return updated;
}

export function deleteEvent(eventId: string): boolean {
  const index = events.findIndex((e) => e.id === eventId);
  if (index === -1) return false;
  events.splice(index, 1);
  for (let i = rsvps.length - 1; i >= 0; i--) {
    const item = rsvps[i];
    if (item && item.eventId === eventId) {
      rsvps.splice(i, 1);
    }
  }
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
  const id = uuidv4();
  const rsvp: Rsvp = RsvpSchema.parse({ id, createdAt: nowIso, ...parsed });
  if (pool) {
    void query(
      'INSERT INTO rsvps (id, event_id, name, email, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
      [id, parsed.eventId, parsed.name, parsed.email, parsed.status ?? 'yes', nowIso]
    );
  }
  rsvps.push(rsvp);
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
  return updated;
}

export function deleteRsvp(rsvpId: string): boolean {
  const index = rsvps.findIndex((r) => r.id === rsvpId);
  if (index === -1) return false;
  rsvps.splice(index, 1);
  return true;
}

export function getTicketByRsvpId(rsvpId: string): Ticket | undefined {
  return tickets.find((t) => t.rsvpId === rsvpId);
}

export function getTicketByToken(token: string): Ticket | undefined {
  return tickets.find((t) => t.token === token);
}

export function createTicketForRsvp(rsvpId: string): Ticket {
  const existing = getTicketByRsvpId(rsvpId);
  if (existing) return existing;
  const id = uuidv4();
  const token = uuidv4();
  const ticket: Ticket = { id, rsvpId, token, issuedAt: new Date().toISOString(), status: 'valid' };
  if (pool) {
    void query(
      'INSERT INTO tickets (id, rsvp_id, token, issued_at, status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING',
      [id, rsvpId, token, ticket.issuedAt, 'valid']
    );
  }
  tickets.push(ticket);
  return ticket;
}

export function markTicketCheckedIn(token: string): { ticket: Ticket; already: boolean } {
  const ticket = getTicketByToken(token);
  if (!ticket) throw new Error('ticket_not_found');
  if (ticket.checkedInAt) {
    return { ticket, already: true };
  }
  ticket.checkedInAt = new Date().toISOString();
  ticket.status = 'used';
  if (pool) {
    void query('UPDATE tickets SET checked_in_at = NOW(), status = $1 WHERE token = $2', ['used', token]);
  }
  return { ticket, already: false };
}