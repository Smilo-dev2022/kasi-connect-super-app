import Redis from 'ioredis';
import { config } from './config';

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) return client;
  client = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    keyPrefix: config.redis.keyPrefix,
    lazyConnect: true,
    maxRetriesPerRequest: 3
  });
  return client;
}

export async function ensureRedisConnected(): Promise<void> {
  const c = getRedisClient();
  if (c.status === 'ready' || c.status === 'connecting') return;
  await c.connect();
}

export async function quitRedis(): Promise<void> {
  if (!client) return;
  try {
    await client.quit();
  } finally {
    client = null;
  }
}

