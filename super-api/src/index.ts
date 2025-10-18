import Fastify from 'fastify';
import metrics from './plugins/metrics.js';
import health from './plugins/health.js';
import security from './plugins/security.js';
import swagger from './plugins/swagger.js';
import proxyModule from './modules/proxy.js';
import { Server as IOServer } from 'socket.io';
import authModule from './modules/auth/index.js';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(security);
  await app.register(metrics);
  await app.register(health);
  await app.register(swagger);
  // Register reverse-proxy routes so all external calls go through Super API
  await app.register(proxyModule);

  // REST modules under /api (wrap to ensure prefix applies)
  await app.register(async (api) => {
    await api.register(authModule);
    // Temporary: mount messaging-compatible routes path to ease migration
    const { default: middie } = await import('@fastify/middie');
    await api.register(middie);
    // Provide a convenience redirect for existing clients
    api.get('/messages/*', async (_req, reply) => reply.redirect(308, '/api/msg' + (_req.params as any)['*']));
    api.get('/groups/*', async (_req, reply) => reply.redirect(308, '/api/msg' + (_req.params as any)['*']));
    api.get('/safety/*', async (_req, reply) => reply.redirect(308, '/api/msg' + (_req.params as any)['*']));
    api.get('/keys/*', async (_req, reply) => reply.redirect(308, '/api/msg' + (_req.params as any)['*']));
  }, { prefix: '/api' });

  // Socket.IO attached to Fastify's underlying Node server
  const io = new IOServer(app.server, { path: '/socket.io' });
  app.decorate('io', io as any);
  const { registerChatNamespace } = await import('./ws/chat.js');
  registerChatNamespace(io);

  const port = Number(process.env.PORT || 8081);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  app.log.info({ port, host }, 'Super API listening');
  return { app, io };
}

buildServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
