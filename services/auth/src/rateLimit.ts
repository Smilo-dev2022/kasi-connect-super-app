import { RateLimiterRedis } from 'rate-limiter-flexible';
import { getRedisClient } from './redis';

export function createRateLimiter(points: number, durationSeconds: number, keyPrefix: string) {
  const redis = getRedisClient();
  return new RateLimiterRedis({
    storeClient: redis as any,
    keyPrefix,
    points,
    duration: durationSeconds,
    insuranceLimiter: undefined
  });
}

