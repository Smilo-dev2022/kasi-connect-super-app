import { ENV } from '@api/../config/env';
import * as Keychain from 'react-native-keychain';

export type TypingEvent = { threadId: string; userId: string; typing: boolean };

let socket: WebSocket | null = null;

export async function getSocket(): Promise<WebSocket> {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;
  // Prefer header, but browser RN WebSocket can't set headers; use query token
  let token: string | null = null;
  try {
    const creds = await Keychain.getGenericPassword({ service: 'ikasi-token' });
    token = creds ? creds.password : null;
  } catch {
    token = null;
  }
  const url = token ? `${ENV.socketUrl.replace(/\/$/, '')}?token=${encodeURIComponent(token)}` : ENV.socketUrl;
  socket = new WebSocket(url);
  return socket;
}

export function emitTyping(threadId: string, userId: string, typing: boolean) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const payload = { type: 'typing', to: threadId, scope: 'direct', isTyping: typing };
  socket.send(JSON.stringify(payload));
}

export function onTyping(callback: (evt: TypingEvent) => void) {
  if (!socket) return () => {};
  const handler = (event: MessageEvent) => {
    try {
      const data = JSON.parse(String((event as any).data || ''));
      if (data?.type === 'typing') {
        callback({ threadId: String(data.to), userId: String(data.from), typing: Boolean(data.isTyping) });
      }
    } catch {}
  };
  (socket as any).addEventListener('message', handler);
  return () => (socket as any).removeEventListener('message', handler);
}