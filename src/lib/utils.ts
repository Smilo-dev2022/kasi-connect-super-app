import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyZAR(amount: number, locale: string = "en-ZA"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: "ZAR", currencyDisplay: "narrowSymbol" }).format(amount);
  } catch {
    return `R${amount.toLocaleString()}`;
  }
}

export function formatNumberLocale(value: number, locale: string = "en-ZA"): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return value.toLocaleString();
  }
}

export function formatRelativeTime(date: Date, base: Date = new Date(), locale: string = "en-ZA"): string {
  const diffMs = base.getTime() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(-diffMinutes, "minute");
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(-diffHours, "hour");
  }
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(-diffDays, "day");
}

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export type WsClientOptions = {
  url: string;
  userId?: string;
};

export type OutgoingMessage = {
  type: 'msg';
  to: string;
  scope: 'direct' | 'group';
  ciphertext: string;
  contentType?: string;
  timestamp?: number;
};

export type IncomingMessage = {
  type: 'msg';
  id: string;
  from: string;
  to: string;
  scope: 'direct' | 'group';
  ciphertext: string;
  contentType?: string;
  timestamp: number;
};

export class SimpleWsClient {
  private socket: WebSocket | null = null;
  private options: WsClientOptions;
  private listeners: Array<(m: IncomingMessage) => void> = [];

  constructor(options: WsClientOptions) {
    this.options = options;
  }

  connect() {
    const u = new URL(this.options.url);
    if (this.options.userId) {
      u.searchParams.set('userId', this.options.userId);
    }
    this.socket = new WebSocket(u.toString());
    this.socket.addEventListener('message', (ev) => {
      try {
        const data = JSON.parse(String(ev.data));
        if (data && data.type === 'msg') {
          this.listeners.forEach((l) => l(data as IncomingMessage));
        }
      } catch {}
    });
  }

  onMessage(cb: (m: IncomingMessage) => void) {
    this.listeners.push(cb);
  }

  send(message: OutgoingMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }
}
