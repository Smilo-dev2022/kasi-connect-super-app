import Fastify from 'fastify'
import { config } from './config.js'
import { ensureMessagesCollection } from './typesense.js'
import { registerRoutes } from './routes.js'

async function main(): Promise<void> {
  const app = Fastify({ logger: true })

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
