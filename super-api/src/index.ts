import Fastify from 'fastify';
import metrics from './plugins/metrics.js';
import health from './plugins/health.js';
import security from './plugins/security.js';
import swagger from './plugins/swagger.js';
import { Server as IOServer } from 'socket.io';
import authModule from './modules/auth/index.js';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(security);
  await app.register(metrics);
  await app.register(health);
  await app.register(swagger);

  // REST modules
  await app.register(authModule);

  // Socket.IO attached to Fastify's underlying Node server
  const io = new IOServer(app.server, { path: '/socket.io' });
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
