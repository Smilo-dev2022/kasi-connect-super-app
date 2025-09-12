import fp from 'fastify-plugin';
import type { FastifyPluginCallback } from 'fastify';
import { verifyAuthToken } from './jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string };
  }
}

const authGuardPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('preHandler', async (request, reply) => {
    // Only guard routes that set preValidation/preHandler to 'requiresAuth'
    if ((request.routeOptions.config as any)?.requiresAuth !== true) {
      return;
    }
    const header = request.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
    const token = header.slice('Bearer '.length);
    try {
      const payload = await verifyAuthToken(token);
      request.user = { id: payload.userId };
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
      return;
    }
  });

  done();
};

export const authGuard = fp(authGuardPlugin);

