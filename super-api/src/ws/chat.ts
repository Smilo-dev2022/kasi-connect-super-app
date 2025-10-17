import { Server, Socket } from 'socket.io';
// Note: apply rate limits at Fastify layer for REST; Socket.IO uses basic guards here

export function registerChatNamespace(io: Server) {
  const nsp = io.of('/ws/chat');

  nsp.use((socket, next) => {
    // Simple token passthrough; in real setup, verify JWT
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Unauthorized'));
    return next();
  });

  nsp.on('connection', (socket: Socket) => {
    socket.on('join', (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on('message.send', (payload: { conversation_id: string; text: string }) => {
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
  });
}
