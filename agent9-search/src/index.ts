import Fastify from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import { config } from './config.js'
import { ensureMessagesCollection } from './typesense.js'
import { registerRoutes } from './routes.js'

async function main(): Promise<void> {
  const app = Fastify({ logger: true })

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false
  })

  const enforceHttps = (process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true'
  if (enforceHttps) {
    app.addHook('onRequest', async (req, reply) => {
      const upgrade = String(req.headers['upgrade'] || '').toLowerCase()
      if (upgrade === 'websocket') return
      const proto = req.headers['x-forwarded-proto'] as string | undefined
      if (proto !== 'https') {
        const host = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string)
        reply.redirect(308, `https://${host}${req.url}`)
      }
    })
  }

  try {
    await ensureMessagesCollection()
  } catch (err) {
    app.log.warn({ err }, 'Typesense not ready; continuing to start server')
  }

  registerRoutes(app)

  await app.listen({ port: config.port, host: '0.0.0.0' })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
