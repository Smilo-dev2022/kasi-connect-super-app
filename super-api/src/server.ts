import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import httpProxy from '@fastify/http-proxy';
import { collectDefaultMetrics, register } from 'prom-client';

const PORT = Number(process.env.PORT || 8081);

// Upstream service URLs (internal Docker service names)
const AUTH_URL = process.env.AUTH_URL || 'http://auth:4010';
const MESSAGING_URL = process.env.MESSAGING_URL || 'http://agent7-messaging:8080';
const MEDIA_URL = process.env.MEDIA_URL || 'http://media:4008';
const SEARCH_URL = process.env.SEARCH_URL || 'http://search:4009';
const EVENTS_URL = process.env.EVENTS_URL || 'http://events:8000';
const MODERATION_URL = process.env.MODERATION_URL || 'http://moderation:8082';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet);

  // OpenAPI + Docs (minimal)
  await app.register(swagger, {
    openapi: {
      info: { title: 'Super API', version: '0.1.0' }
    }
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Health
  app.get('/healthz', async () => ({ status: 'ok' }));

  // Metrics
  collectDefaultMetrics();
  app.get('/metrics', async (_, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Proxies using http-proxy
  await app.register(httpProxy, { upstream: AUTH_URL, prefix: '/auth/otp' });
  await app.register(httpProxy, { upstream: AUTH_URL, prefix: '/devices' });

  await app.register(httpProxy, { upstream: MESSAGING_URL, prefix: '/auth/dev-token' });
  await app.register(httpProxy, { upstream: MESSAGING_URL, prefix: '/groups' });
  await app.register(httpProxy, { upstream: MESSAGING_URL, prefix: '/messages' });
  await app.register(httpProxy, { upstream: MESSAGING_URL, prefix: '/safety' });
  await app.register(httpProxy, { upstream: MESSAGING_URL, prefix: '/keys' });
  // For dev, connect socket.io directly to messaging at 8080

  await app.register(httpProxy, { upstream: MEDIA_URL, prefix: '/uploads' });
  await app.register(httpProxy, { upstream: MEDIA_URL, prefix: '/media' });
  await app.register(httpProxy, { upstream: MEDIA_URL, prefix: '/thumb' });

  await app.register(httpProxy, { upstream: SEARCH_URL, prefix: '/search' });

  await app.register(httpProxy, { upstream: EVENTS_URL, prefix: '/api' });
  await app.register(httpProxy, { upstream: EVENTS_URL, prefix: '/wallet' });

  await app.register(httpProxy, { upstream: MODERATION_URL, prefix: '/moderation' });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Super API listening on ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
