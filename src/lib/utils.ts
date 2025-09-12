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
