export type EventCategory = "community" | "sports" | "religious" | "entertainment";

export type IconName = "megaphone" | "trophy" | "church" | "music";

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  organizer: string;
  attendees: number;
  capacity: number;
  price: number;
  category: EventCategory;
  verified: boolean;
  iconName: IconName;
}

export interface EnrichedEvent extends EventRecord {
  rsvp: boolean;
}

export interface TicketRecord {
  id: string;
  eventId: string;
  createdAtIso: string;
  pricePaid: number;
  status: "valid" | "refunded" | "cancelled";
}

const RSVP_STORAGE_KEY = "app_rsvps";
const TICKETS_STORAGE_KEY = "app_tickets";

function safeGetLocalStorageItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetLocalStorageItem(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function loadRsvps(): Set<string> {
  const raw = safeGetLocalStorageItem(RSVP_STORAGE_KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveRsvps(rsvpSet: Set<string>): void {
  const arr = Array.from(rsvpSet);
  safeSetLocalStorageItem(RSVP_STORAGE_KEY, JSON.stringify(arr));
}

function loadTickets(): TicketRecord[] {
  const raw = safeGetLocalStorageItem(TICKETS_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as TicketRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTickets(tickets: TicketRecord[]): void {
  safeSetLocalStorageItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

// Initial demo events (can be replaced by API later)
const INITIAL_EVENTS: EventRecord[] = [
  {
    id: "1",
    title: "Ward 12 Community Meeting",
    description: "Monthly community meeting to discuss local issues and developments",
    dateLabel: "Dec 15, 2024",
    timeLabel: "18:00",
    location: "Community Hall, Main Road",
    organizer: "Ward Councillor",
    attendees: 45,
    capacity: 100,
    price: 0,
    category: "community",
    verified: true,
    iconName: "megaphone",
  },
  {
    id: "2",
    title: "Youth Soccer Tournament",
    description: "Annual inter-township soccer competition for ages 16-25",
    dateLabel: "Dec 18, 2024",
    timeLabel: "09:00",
    location: "Sports Ground, 5th Avenue",
    organizer: "Soweto Youth FC",
    attendees: 120,
    capacity: 200,
    price: 20,
    category: "sports",
    verified: true,
    iconName: "trophy",
  },
  {
    id: "3",
    title: "Sunday Service",
    description: "Weekly community worship service with special guest speaker",
    dateLabel: "Dec 17, 2024",
    timeLabel: "09:00",
    location: "Methodist Church",
    organizer: "Pastor Mthembu",
    attendees: 85,
    capacity: 150,
    price: 0,
    category: "religious",
    verified: true,
    iconName: "church",
  },
  {
    id: "4",
    title: "Jazz & Braai Festival",
    description: "Live music, local food vendors, and community celebration",
    dateLabel: "Dec 22, 2024",
    timeLabel: "15:00",
    location: "Park Amphitheater",
    organizer: "Township Cultural Committee",
    attendees: 78,
    capacity: 300,
    price: 50,
    category: "entertainment",
    verified: true,
    iconName: "music",
  },
];

export function listEvents(): EnrichedEvent[] {
  const rsvps = loadRsvps();
  return INITIAL_EVENTS.map((e) => ({ ...e, rsvp: rsvps.has(e.id) }));
}

export function getEventById(eventId: string): EnrichedEvent | undefined {
  const base = INITIAL_EVENTS.find((e) => e.id === eventId);
  if (!base) return undefined;
  const rsvps = loadRsvps();
  return { ...base, rsvp: rsvps.has(base.id) };
}

export function isRsvpd(eventId: string): boolean {
  return loadRsvps().has(eventId);
}

export function setRsvp(eventId: string, value: boolean): boolean {
  const rsvps = loadRsvps();
  if (value) {
    rsvps.add(eventId);
  } else {
    rsvps.delete(eventId);
  }
  saveRsvps(rsvps);
  return rsvps.has(eventId);
}

export function toggleRsvp(eventId: string): boolean {
  const rsvps = loadRsvps();
  if (rsvps.has(eventId)) {
    rsvps.delete(eventId);
  } else {
    rsvps.add(eventId);
  }
  saveRsvps(rsvps);
  return rsvps.has(eventId);
}

function generateId(): string {
  // Prefer crypto.randomUUID if available
  if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
    return (crypto as any).randomUUID();
  }
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTicket(eventId: string): TicketRecord {
  const event = INITIAL_EVENTS.find((e) => e.id === eventId);
  if (!event) {
    throw new Error("Event not found");
  }
  const ticket: TicketRecord = {
    id: generateId(),
    eventId,
    createdAtIso: new Date().toISOString(),
    pricePaid: event.price,
    status: "valid",
  };
  const tickets = loadTickets();
  tickets.push(ticket);
  saveTickets(tickets);
  return ticket;
}

export function listTickets(): TicketRecord[] {
  return loadTickets();
}

export function getTicketById(ticketId: string): TicketRecord | undefined {
  return loadTickets().find((t) => t.id === ticketId);
}

export function getTicketsForEvent(eventId: string): TicketRecord[] {
  return loadTickets().filter((t) => t.eventId === eventId);
}

