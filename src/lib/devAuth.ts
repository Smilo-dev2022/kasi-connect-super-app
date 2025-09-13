// Support environments where import.meta typing may not include env
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_MESSAGING_API = ((import.meta as any)?.env?.VITE_MSG_API as string | undefined) || 'http://localhost:8080';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_AUTH_API = ((import.meta as any)?.env?.VITE_AUTH_API as string | undefined) || 'http://localhost:4010';

type StoredTokens = Record<string, string>;

function getStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function getMessagingApiBase(): string {
  return DEFAULT_MESSAGING_API;
}

export function getAuthApiBase(): string {
  return DEFAULT_AUTH_API;
}

export function getCurrentUserId(): string {
  const storage = getStorage();
  const fromStorage = storage?.getItem('devUserId');
  if (fromStorage) return fromStorage;
  // default demo user
  return 'user-demo';
}

export function setCurrentUserId(userId: string) {
  const storage = getStorage();
  storage?.setItem('devUserId', userId);
}

export async function getDevTokenForUser(userId: string, name?: string): Promise<string> {
  const storage = getStorage();
  const raw = storage?.getItem('devTokens');
  const map: StoredTokens = raw ? JSON.parse(raw) : {};
  if (map[userId]) return map[userId];

  const res = await fetch(`${getMessagingApiBase()}/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  });
  if (!res.ok) throw new Error('failed-to-get-dev-token');
  const data = (await res.json()) as { token: string };
  map[userId] = data.token;
  storage?.setItem('devTokens', JSON.stringify(map));
  return data.token;
}

// OTP Auth service helpers
const AUTH_JWT_KEY = 'auth.jwt';
const AUTH_REFRESH_KEY = 'auth.refresh';

export function getStoredAuthToken(): string | undefined {
  return getStorage()?.getItem(AUTH_JWT_KEY) || undefined;
}

export function setStoredAuthToken(token: string | undefined): void {
  const storage = getStorage();
  if (!storage) return;
  if (token) storage.setItem(AUTH_JWT_KEY, token);
  else storage.removeItem(AUTH_JWT_KEY);
}

export function getStoredRefreshToken(): string | undefined {
  return getStorage()?.getItem(AUTH_REFRESH_KEY) || undefined;
}

export function setStoredRefreshToken(token: string | undefined): void {
  const storage = getStorage();
  if (!storage) return;
  if (token) storage.setItem(AUTH_REFRESH_KEY, token);
  else storage.removeItem(AUTH_REFRESH_KEY);
}

export async function requestOtp(channel: 'sms' | 'email', to: string): Promise<void> {
  const res = await fetch(`${getAuthApiBase()}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel, to })
  });
  if (!res.ok) throw new Error('otp-request-failed');
}

export async function verifyOtp(params: { channel: 'sms' | 'email'; to: string; code: string; device?: { platform: 'ios' | 'android' | 'web'; token: string } }): Promise<string> {
  const res = await fetch(`${getAuthApiBase()}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('otp-verify-failed');
  const data = (await res.json()) as { token: string; refresh?: string };
  setStoredAuthToken(data.token);
  if (data.refresh) setStoredRefreshToken(data.refresh);
  return data.token;
}

export async function refreshToken(): Promise<string | undefined> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return undefined;
  const res = await fetch(`${getAuthApiBase()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });
  if (!res.ok) return undefined;
  const data = (await res.json()) as { token: string; refresh?: string };
  setStoredAuthToken(data.token);
  if (data.refresh) setStoredRefreshToken(data.refresh);
  return data.token;
}

