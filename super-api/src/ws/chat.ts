import { Server, Socket } from 'socket.io';
// Socket-side naive rate limiter to avoid flooding

type TokenBucket = { tokens: number; lastRefill: number };
const WINDOW_MS = 10_000;
const MAX_EVENTS_PER_WINDOW = 30;

function allowEvent(bucket: TokenBucket): boolean {
  const now = Date.now();
  if (now - bucket.lastRefill > WINDOW_MS) {
    bucket.tokens = 0;
    bucket.lastRefill = now;
  }
  if (bucket.tokens >= MAX_EVENTS_PER_WINDOW) return false;
  bucket.tokens += 1;
  return true;
}

export function registerChatNamespace(io: Server) {
  const nsp = io.of('/ws/chat');

  nsp.use((socket, next) => {
    // Simple token passthrough; in real setup, verify JWT
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Unauthorized'));
    return next();
  });

  nsp.on('connection', (socket: Socket) => {
    const bucket: TokenBucket = { tokens: 0, lastRefill: Date.now() };
    socket.on('join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('message.send', (payload: { conversation_id: string; text: string }) => {
      if (!allowEvent(bucket)) {
        socket.emit('error', { code: 'rate_limited' });
        return;
      }
      nsp.to(`conv:${payload.conversation_id}`).emit('message.new', {
        id: Date.now().toString(),
        ...payload,
        ts: Date.now()
      });
    });

    socket.on('typing.start', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('typing.start', { user: socket.id });
    });
    socket.on('typing.stop', (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit('typing.stop', { user: socket.id });
    });

    socket.on('presence.update', (payload: { conversation_id: string; status: 'online'|'offline'|'away' }) => {
      if (!allowEvent(bucket)) return;
      socket.to(`conv:${payload.conversation_id}`).emit('presence.update', { user: socket.id, status: payload.status, ts: Date.now() });
    });
  });
}
