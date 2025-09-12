import type { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { z } from 'zod';

const createSchema = z.object({
  platform: z.enum(['ios', 'android', 'web']),
  token: z.string().min(1),
});

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post(
    '/devices',
    {
      config: { requiresAuth: true, rateLimit: { max: 60, timeWindow: 60_000 } },
    },
    async (request, reply) => {
      if (!request.user) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }
      const parse = createSchema.safeParse(request.body);
      if (!parse.success) {
        reply.code(400).send({ error: 'Bad request' });
        return;
      }
      const { platform, token } = parse.data;
      const device = fastify.db.registerDevice(request.user.id, platform, token);
      reply.code(201).send(device);
    }
  );

  fastify.delete(
    '/devices/:id',
    {
      config: { requiresAuth: true, rateLimit: { max: 60, timeWindow: 60_000 } },
    },
    async (request, reply) => {
      if (!request.user) {
        reply.code(401).send({ error: 'Unauthorized' });
        return;
      }
      const id = (request.params as any).id as string;
      const ok = fastify.db.deleteDevice(request.user.id, id);
      if (!ok) {
        reply.code(404).send({ error: 'Not found' });
        return;
      }
      reply.code(204).send();
    }
  );

  done();
};

export default fp(plugin);

