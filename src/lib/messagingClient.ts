import { getDevTokenForUser, getMessagingApiBase, getStoredAuthToken } from './devAuth';

export type OutgoingMessage = {
  to: string;
  scope: 'direct' | 'group';
  ciphertext: string;
  contentType?: string;
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

export type Listener = (message: IncomingMessage) => void;

export class MessagingClient {
  private socket?: WebSocket;
  private listeners: Set<Listener> = new Set();
  private token?: string;

  async connect(userId: string): Promise<void> {
    // Prefer Auth JWT if available; otherwise use dev token endpoint
    this.token = getStoredAuthToken() || await getDevTokenForUser(userId);
    const url = new URL('/ws', getMessagingApiBase());
    url.searchParams.set('token', this.token);
    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(url.toString());
      let resolved = false;
      socket.onopen = () => {
        resolved = true;
        resolve();
      };
      socket.onmessage = (ev) => {
        try {
          const data = JSON.parse(String(ev.data));
          if (data?.type === 'msg') this.emit(data as IncomingMessage);
        } catch {}
      };
      socket.onerror = () => {
        if (!resolved) reject(new Error('ws-open-failed'));
      };
      socket.onclose = () => {};
      this.socket = socket;
    });
  }

  onMessage(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(message: IncomingMessage) {
    for (const l of this.listeners) l(message);
  }

  send(message: OutgoingMessage) {
    const payload = { type: 'msg', ...message } as const;
    this.socket?.send(JSON.stringify(payload));
  }
}

