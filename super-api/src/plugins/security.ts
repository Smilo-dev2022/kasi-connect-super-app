import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';

export default fp(async function security(fastify) {
  await fastify.register(sensible);
  await fastify.register(helmet);
  await fastify.register(cors, { origin: true, credentials: true });
  await fastify.register(rateLimit, { max: 200, timeWindow: '1 minute' });
});
