import Redis from 'ioredis';

export const createRedisClient = (url: string): Redis => {
  const client = new Redis(url);
  return client;
};

export const probeRedis = async (client: Redis): Promise<boolean> => {
  try {
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
};

