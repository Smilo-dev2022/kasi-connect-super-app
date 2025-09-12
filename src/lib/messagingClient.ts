import { getDevTokenForUser, getMessagingApiBase } from './devAuth';

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
export type TypingListener = (evt: { userId: string; to: string; scope: 'direct' | 'group'; isTyping: boolean; timestamp: number }) => void;
export type ReceiptListener = (evt: { kind: 'delivered' | 'read'; messageId: string; userId: string; timestamp: number }) => void;

export class MessagingClient {
  private socket?: WebSocket;
  private listeners: Set<Listener> = new Set();
  private typingListeners: Set<TypingListener> = new Set();
  private receiptListeners: Set<ReceiptListener> = new Set();
  private token?: string;

  async connect(userId: string): Promise<void> {
    this.token = await getDevTokenForUser(userId);
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
          else if (data?.type === 'typing') this.emitTyping({ userId: data.userId, to: data.to, scope: data.scope, isTyping: data.isTyping, timestamp: data.timestamp });
          else if (data?.type === 'delivered' || data?.type === 'read') this.emitReceipt({ kind: data.type, messageId: data.messageId, userId: data.userId, timestamp: data.timestamp });
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

  private emitTyping(evt: { userId: string; to: string; scope: 'direct' | 'group'; isTyping: boolean; timestamp: number }) {
    for (const l of this.typingListeners) l(evt);
  }

  private emitReceipt(evt: { kind: 'delivered' | 'read'; messageId: string; userId: string; timestamp: number }) {
    for (const l of this.receiptListeners) l(evt);
  }

  send(message: OutgoingMessage) {
    const payload = { type: 'msg', ...message } as const;
    this.socket?.send(JSON.stringify(payload));
  }

  sendTyping(to: string, scope: 'direct' | 'group', isTyping: boolean) {
    const payload = { type: 'typing', to, scope, isTyping, timestamp: Date.now() } as const;
    this.socket?.send(JSON.stringify(payload));
  }

  markDelivered(messageId: string) {
    const payload = { type: 'delivered', messageId, timestamp: Date.now() } as const;
    this.socket?.send(JSON.stringify(payload));
  }

  markRead(messageId: string) {
    const payload = { type: 'read', messageId, timestamp: Date.now() } as const;
    this.socket?.send(JSON.stringify(payload));
  }

  onTyping(listener: TypingListener) {
    this.typingListeners.add(listener);
    return () => this.typingListeners.delete(listener);
  }

  onReceipt(listener: ReceiptListener) {
    this.receiptListeners.add(listener);
    return () => this.receiptListeners.delete(listener);
  }
}

