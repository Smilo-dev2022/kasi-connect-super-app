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

const events: Event[] = [];
const rsvps: Rsvp[] = [];
const tickets: Ticket[] = [];

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
  const rsvp: Rsvp = RsvpSchema.parse({
    id: uuidv4(),
    createdAt: nowIso,
    ...parsed,
  });
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
  const ticket: Ticket = {
    id: uuidv4(),
    rsvpId,
    token: uuidv4(),
    issuedAt: new Date().toISOString(),
    status: 'valid',
  };
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
  return { ticket, already: false };
}