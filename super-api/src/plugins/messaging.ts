import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Server } from 'socket.io';
import { createServer } from 'node:http';

export async function setupSocketIO(app: FastifyInstance) {
  const server = createServer(app as any);
  const io = new Server(server, { path: '/socket.io' });

  io.on('connection', (socket) => {
    socket.emit('hello', { ts: Date.now() });
    socket.on('typing', (payload) => {
      socket.broadcast.emit('typing', payload);
    });
  });

  const port = Number(process.env.PORT || 8081);
  await new Promise<void>((resolve) => server.listen(port, '0.0.0.0', () => resolve()));
  (app.log as any).info(`Socket.IO attached on port ${port}`);
}

export default async function messagingPlugin(_app: FastifyInstance, _opts: FastifyPluginOptions) {
  // placeholder; Socket.IO server is set up via setupSocketIO
}
