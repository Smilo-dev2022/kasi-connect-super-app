import { getCurrentUserId, getDevTokenForUser, getMessagingApiBase } from './devAuth';

export type PushPlatform = 'ios' | 'android' | 'web';

export async function registerDevice(platform: PushPlatform, token: string): Promise<{ id: string } | undefined> {
  const userId = getCurrentUserId();
  const jwt = await getDevTokenForUser(userId);
  const base = getMessagingApiBase();
  const res = await fetch(`${base}/devices`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ platform, token })
  });
  if (!res.ok) return undefined;
  const data = await res.json();
  return { id: data.id };
}

export async function unregisterDevice(id: string): Promise<boolean> {
  const userId = getCurrentUserId();
  const jwt = await getDevTokenForUser(userId);
  const base = getMessagingApiBase();
  const res = await fetch(`${base}/devices/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${jwt}` } });
  return res.ok;
}

