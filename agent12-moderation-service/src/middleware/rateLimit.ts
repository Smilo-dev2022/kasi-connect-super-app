import { Request, Response, NextFunction } from "express";
import { loadConfig } from "../config";

type Key = string;

const buckets: Map<Key, { count: number; resetAt: number }> = new Map();

export function rateLimitReports(req: Request, res: Response, next: NextFunction) {
  const { rateLimitMax, rateLimitWindowMs } = loadConfig();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const key = `reports:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    res.setHeader("X-RateLimit-Limit", String(rateLimitMax));
    res.setHeader("X-RateLimit-Remaining", String(rateLimitMax - 1));
    res.setHeader("X-RateLimit-Reset", String(Math.floor((now + rateLimitWindowMs) / 1000)));
    return next();
  }
  if (bucket.count >= rateLimitMax) {
    const retryAfterSec = Math.max(0, Math.floor((bucket.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSec));
    return res.status(429).json({ error: "rate_limited" });
  }
  bucket.count += 1;
  res.setHeader("X-RateLimit-Limit", String(rateLimitMax));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, rateLimitMax - bucket.count)));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(bucket.resetAt / 1000)));
  return next();
}

