import 'fastify';
import type client from 'prom-client';
import type { Registry } from 'prom-client';

declare module 'fastify' {
  interface FastifyInstance {
    metrics: { client: typeof client; registry: Registry };
  }
}
