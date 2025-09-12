import Redis from 'ioredis';
import { config } from './config';

export const redis = new Redis(config.redisUrl);

redis.on('error', (err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Redis error', err);
});

