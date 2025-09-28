// Caching utilities for iKasiLink
// Provides in-memory and localStorage caching with TTL support

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
}

class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private readonly defaultTtl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTtl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
  }

  set(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    };

    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, item);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

class LocalStorageCache<T> {
  private readonly prefix: string;
  private readonly defaultTtl: number;

  constructor(prefix: string = 'ikasilink_cache', defaultTtl: number = 5 * 60 * 1000) {
    this.prefix = prefix;
    this.defaultTtl = defaultTtl;
  }

  private getKey(key: string): string {
    return `${this.prefix}_${key}`;
  }

  set(key: string, data: T, ttl?: number): void {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTtl
      };

      localStorage.setItem(this.getKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache item in localStorage:', error);
    }
  }

  get(key: string): T | null {
    try {
      const itemStr = localStorage.getItem(this.getKey(key));
      if (!itemStr) {
        return null;
      }

      const item: CacheItem<T> = JSON.parse(itemStr);
      
      // Check if item has expired
      if (Date.now() - item.timestamp > item.ttl) {
        this.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve item from localStorage:', error);
      return null;
    }
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('Failed to delete item from localStorage:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
  }
}

// Singleton instances
export const memoryCache = new MemoryCache();
export const localStorageCache = new LocalStorageCache();

// Utility functions for common caching patterns
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { useLocalStorage?: boolean } = {}
): Promise<T> {
  const { useLocalStorage = false, ttl } = options;
  const cache = useLocalStorage ? localStorageCache : memoryCache;

  // Try to get from cache first
  const cached = cache.get(key);
  if (cached !== null) {
    return cached as T;
  }

  // Fetch fresh data
  const data = await fetcher();
  
  // Cache the result
  cache.set(key, data, ttl);
  
  return data;
}

// Cache for API responses
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: CacheOptions & { useLocalStorage?: boolean } = {}
): Promise<T> {
  const cacheKey = `fetch_${url}_${JSON.stringify(options)}`;
  
  return withCache(
    cacheKey,
    async () => {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json() as Promise<T>;
    },
    cacheOptions
  );
}

// Cache for user data
export const userCache = new MemoryCache<any>({ ttl: 10 * 60 * 1000 }); // 10 minutes

// Cache for business listings
export const businessCache = new MemoryCache<any[]>({ ttl: 30 * 60 * 1000 }); // 30 minutes

// Cache for events
export const eventsCache = new MemoryCache<any[]>({ ttl: 15 * 60 * 1000 }); // 15 minutes

// Cache for groups
export const groupsCache = new MemoryCache<any[]>({ ttl: 5 * 60 * 1000 }); // 5 minutes

// Cache invalidation utilities
export function invalidateUserCache(userId?: string): void {
  if (userId) {
    userCache.delete(`user_${userId}`);
  } else {
    userCache.clear();
  }
}

export function invalidateBusinessCache(): void {
  businessCache.clear();
}

export function invalidateEventsCache(): void {
  eventsCache.clear();
}

export function invalidateGroupsCache(): void {
  groupsCache.clear();
}

// Cache warming utilities
export async function warmCache(): Promise<void> {
  try {
    // Warm up frequently accessed data
    const promises = [
      // Add cache warming logic here
    ];

    await Promise.allSettled(promises);
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

// Cleanup expired items periodically
export function startCacheCleanup(intervalMs: number = 60 * 1000): void {
  setInterval(() => {
    memoryCache.cleanup();
  }, intervalMs);
}

// Export types
export { MemoryCache, LocalStorageCache };
export type { CacheItem, CacheOptions };
