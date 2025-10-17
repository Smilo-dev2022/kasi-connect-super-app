import fp from 'fastify-plugin';
import client, { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client';
import { FastifyInstance } from 'fastify';

// Shared registry across the app
const registry: Registry = new client.Registry();
collectDefaultMetrics({ register: registry });

export const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry]
});

export const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [registry]
});

const metrics = fp(async function metrics(fastify: FastifyInstance) {
  // Hook to record metrics
  fastify.addHook('onResponse', async (request, reply) => {
    const method = request.method;
    const route = request.routeOptions?.url || request.url;
    const status = String(reply.statusCode);
    httpRequestCounter.labels(method, route, status).inc();
    const diff = Number(process.hrtime.bigint() - (request as any)._startAt) / 1e6;
    httpRequestDurationMs.labels(method, route, status).observe(diff);
  });
  fastify.addHook('onRequest', async (request, _reply) => {
    (request as any)._startAt = process.hrtime.bigint();
  });

  fastify.decorate('metrics', { client, registry });
});

export default metrics;
declare module 'fastify' {
  interface FastifyInstance {
    metrics: { client: typeof client; registry: Registry };
  }
}
