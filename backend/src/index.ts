import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import { createKV } from './kv';
import { createDb } from './db';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import { authGuard } from './auth-guard';

const server = Fastify({ logger: true });
server.register(websocket);
server.register(rateLimit, {
  max: config.rateLimit.globalMax,
  timeWindow: config.rateLimit.globalWindowMs,
  allowList: [],
});

// Init KV and DB
const { kv, isRedis } = createKV();
server.decorate('kv', kv);
const db = createDb();
server.decorate('db', db);

server.addHook('onReady', async () => {
  server.log.info({ store: isRedis ? 'redis' : 'memory' }, 'KV initialized');
});

// Auth guard must be registered before routes
server.register(authGuard);
server.register(authRoutes);
server.register(deviceRoutes);

server.get('/health', async () => {
  return { ok: true };
});

server.get('/ws', { websocket: true }, (connection /*, req */) => {
  connection.socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
  connection.socket.on('message', (raw: unknown) => {
    try {
      const message = JSON.parse(String(raw));
      // TODO: route to messaging service once implemented
      connection.socket.send(
        JSON.stringify({ type: 'echo', received: message, ts: Date.now() })
      );
    } catch {
      connection.socket.send(JSON.stringify({ type: 'error', error: 'Bad JSON' }));
    }
  });
});

async function start() {
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '0.0.0.0';
  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
