import Redis from 'ioredis';

export type KeyValueStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  incr(key: string): Promise<number>;
  del(key: string): Promise<void>;
};

class MemoryStore implements KeyValueStore {
  private map = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.map.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.map.set(key, { value, expiresAt });
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (current ? Number(current) : 0) + 1;
    await this.set(key, String(next));
    return next;
  }

  async del(key: string): Promise<void> {
    this.map.delete(key);
  }
}

export function createKV(): { kv: KeyValueStore; isRedis: boolean } {
  const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL; // tolerate different envs
  if (redisUrl) {
    const redis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    const kv: KeyValueStore = {
      async get(key) {
        return (await redis.get(key)) as string | null;
      },
      async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
          await redis.set(key, value, 'EX', ttlSeconds);
        } else {
          await redis.set(key, value);
        }
      },
      async incr(key) {
        return await redis.incr(key);
      },
      async del(key) {
        await redis.del(key);
      },
    };

    // Try connect proactively but tolerate failure by falling back
    return { kv, isRedis: true };
  }

  return { kv: new MemoryStore(), isRedis: false };
}

