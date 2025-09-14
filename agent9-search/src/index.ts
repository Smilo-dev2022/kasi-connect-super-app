import Fastify from 'fastify'
import { randomUUID } from 'node:crypto'
import client, { Counter, Histogram, Registry } from 'prom-client'
import { config } from './config.js'
import { ensureMessagesCollection } from './typesense.js'
import { registerRoutes } from './routes.js'

// Prometheus metrics setup
const metricsRegistry: Registry = new client.Registry()
client.collectDefaultMetrics({ register: metricsRegistry })

const httpRequestCounter: Counter<string> = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['service', 'method', 'route', 'status'] as const,
  registers: [metricsRegistry],
})

const httpRequestDurationMs: Histogram<string> = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['service', 'method', 'route', 'status'] as const,
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [metricsRegistry],
})

async function main(): Promise<void> {
  const app = Fastify({
    logger: true,
    genReqId: () => randomUUID(),
  })

  try {
    await ensureMessagesCollection()
  } catch (err) {
    app.log.warn({ err }, 'Typesense not ready; continuing to start server')
  }

  // Metrics endpoint
  app.get('/metrics', async (_request, reply) => {
    const body = await metricsRegistry.metrics()
    reply.header('Content-Type', metricsRegistry.contentType)
    return reply.send(body)
  })

  // Request timing and JSON logging
  app.addHook('onRequest', async (request, _reply) => {
    ;(request as any).startTime = process.hrtime.bigint()
  })

  app.addHook('onResponse', async (request, reply) => {
    const service = 'search'
    const route = (request as any).routerPath || request.routeOptions?.url || request.url
    const status = String(reply.statusCode)
    let durationMs = 0
    try {
      const start: bigint | undefined = (request as any).startTime
      if (start) {
        const diffNs = Number(process.hrtime.bigint() - start)
        durationMs = diffNs / 1_000_000
        httpRequestDurationMs.labels({ service, method: request.method, route, status }).observe(durationMs)
      }
    } catch {}
    httpRequestCounter.labels({ service, method: request.method, route, status }).inc()

    // Standardized JSON log
    app.log.info({
      time: new Date().toISOString(),
      level: 'info',
      service,
      request_id: request.id,
      route,
      method: request.method,
      status: reply.statusCode,
      latency_ms: durationMs,
    })
  })

  registerRoutes(app)

  await app.listen({ port: config.port, host: '0.0.0.0' })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
