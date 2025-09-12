import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Consent preference storage (POPIA/GDPR)
export type ConsentPreferences = {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
  timestamp: number;
  version: number;
};

const CONSENT_STORAGE_KEY = "kasilink.consent.preferences";
const CONSENT_VERSION = 1;

export function readConsent(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (!parsed || typeof parsed.version !== "number") return null;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(prefs: Omit<ConsentPreferences, "timestamp" | "version">) {
  const payload: ConsentPreferences = {
    ...prefs,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function hasConsented(): boolean {
  return readConsent() !== null;
}
