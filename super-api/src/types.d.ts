import 'fastify';
import type client from 'prom-client';
import type { Registry } from 'prom-client';
import type { Server as IOServer } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    metrics: { client: typeof client; registry: Registry };
    io: IOServer;
  }
}
