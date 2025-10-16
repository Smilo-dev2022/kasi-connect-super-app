import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import httpProxy from '@fastify/http-proxy';
import client from 'prom-client';
import { randomUUID } from 'node:crypto';
import authPlugin from './plugins/auth.js';
import devicesPlugin from './plugins/devices.js';
import eventsPlugin from './plugins/events.js';
import walletPlugin from './plugins/wallet.js';
import mediaPlugin from './plugins/media.js';
import { setupSocketIO } from './plugins/messaging.js';

const PORT = Number(process.env.PORT || 8081);

const AUTH_URL = process.env.AUTH_URL || 'http://localhost:4010';
const MSG_URL = process.env.MSG_URL || 'http://localhost:8080';
const MEDIA_URL = process.env.MEDIA_URL || 'http://localhost:4008';
// EVENTS_URL deprecated once events moved in-process
const MOD_URL = process.env.MOD_URL || 'http://localhost:8082';
const SEARCH_URL = process.env.SEARCH_URL || 'http://localhost:4009';

async function buildServer() {
  const app = Fastify({ logger: true, genReqId: () => randomUUID() });

  await app.register(fastifyCors, { origin: true });
  await app.register(fastifyHelmet);
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });
  await app.register(fastifyJwt, { secret: process.env.JWT_SECRET || 'devsecret' });

  await app.register(fastifySwagger, {
    openapi: {
      info: { title: 'KasiLink Super API', version: '0.1.0' },
    },
  });
  await app.register(fastifySwaggerUi, { routePrefix: '/docs' });

  // Prometheus metrics
  const registry: client.Registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });
  const httpRequestCounter = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['service', 'method', 'route', 'status'],
    registers: [registry],
  });
  const httpRequestDurationMs = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['service', 'method', 'route', 'status'],
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    registers: [registry],
  });

  app.addHook('onRequest', async (request) => {
    (request as any).startTime = process.hrtime.bigint();
  });
  app.addHook('onResponse', async (request, reply) => {
    const service = 'super_api';
    const route = (request as any).routerPath || request.routeOptions?.url || request.url;
    const status = String(reply.statusCode);
    let durationMs = 0;
    try {
      const start: bigint | undefined = (request as any).startTime;
      if (start) {
        const diffNs = Number(process.hrtime.bigint() - start);
        durationMs = diffNs / 1_000_000;
        httpRequestDurationMs.labels({ service, method: request.method, route, status }).observe(durationMs);
      }
    } catch {}
    httpRequestCounter.labels({ service, method: request.method, route, status }).inc();
  });

  app.get('/metrics', async (_req, reply) => {
    reply.header('Content-Type', registry.contentType);
    return reply.send(await registry.metrics());
  });

  app.get('/healthz', async () => ({ ok: true, service: 'super-api' }));

  // Built-in consolidated modules
  await app.register(authPlugin);
  await app.register(devicesPlugin);
  await app.register(eventsPlugin);
  await app.register(walletPlugin);
  await app.register(mediaPlugin);

  // Proxies to existing services (HTTP only for now)
  await app.register(httpProxy, { upstream: MSG_URL, prefix: '/groups', rewritePrefix: '/groups' });
  await app.register(httpProxy, { upstream: MSG_URL, prefix: '/messages', rewritePrefix: '/messages' });
  await app.register(httpProxy, { upstream: MSG_URL, prefix: '/safety', rewritePrefix: '/safety' });
  await app.register(httpProxy, { upstream: MSG_URL, prefix: '/keys', rewritePrefix: '/keys' });
  await app.register(httpProxy, { upstream: MEDIA_URL, prefix: '/uploads', rewritePrefix: '/uploads' });
  await app.register(httpProxy, { upstream: MEDIA_URL, prefix: '/media', rewritePrefix: '/media' });
  await app.register(httpProxy, { upstream: MEDIA_URL, prefix: '/thumb', rewritePrefix: '/thumb' });
  await app.register(httpProxy, { upstream: SEARCH_URL, prefix: '/search', rewritePrefix: '/search' });
  // Map /moderation/* -> moderation service /api/*
  await app.register(httpProxy, { upstream: MOD_URL, prefix: '/moderation', rewritePrefix: '/api' });

  if (process.env.NODE_ENV === 'production') {
    app.addHook('onRequest', async (request, reply) => {
      const proto = request.headers['x-forwarded-proto'] as string | undefined;
      if (proto && proto !== 'https') {
        const host = (request.headers['x-forwarded-host'] || request.headers.host) as string | undefined;
        if (host) return reply.redirect(301, `https://${host}${request.url}`);
      }
    });
  }

  return app;
}

buildServer()
  .then(async (app) => {
    // Attach Socket.IO and listen via its HTTP server wrapper
    await setupSocketIO(app);
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
