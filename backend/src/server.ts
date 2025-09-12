import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import jwt from '@fastify/jwt';
import { config } from './config';
import { createPostgresPool, probePostgres } from './db/postgres';
import { createRedisClient, probeRedis } from './db/redis';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(websocket);
  await app.register(jwt, { secret: config.jwtSecret });

  const pg = createPostgresPool(config.postgresUrl);
  const redis = createRedisClient(config.redisUrl);

  app.addHook('onClose', async () => {
    await pg.end().catch(() => {});
    await redis.quit().catch(() => {});
  });

  app.get('/', async () => ({ ok: true }));

  app.get('/health', async () => {
    const [pgOk, redisOk] = await Promise.all([probePostgres(pg), probeRedis(redis)]);
    return {
      ok: true,
      uptimeSec: Math.floor(process.uptime()),
      postgres: pgOk ? 'up' : 'down',
      redis: redisOk ? 'up' : 'down',
      env: config.nodeEnv,
    };
  });

  app.get('/ws', { websocket: true }, (connection, req) => {
    connection.socket.on('message', (message: Buffer) => {
      const text = message.toString();
      connection.socket.send(JSON.stringify({ echo: text, ts: Date.now() }));
    });
  });

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

