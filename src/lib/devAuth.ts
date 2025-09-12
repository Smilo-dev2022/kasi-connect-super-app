// Support environments where import.meta typing may not include env
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DEFAULT_MESSAGING_API = ((import.meta as any)?.env?.VITE_MSG_API as string | undefined) || 'http://localhost:8080';

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

