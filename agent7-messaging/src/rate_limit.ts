import { Request, Response, NextFunction } from 'express';
import { rateLimitState } from './state';

const TOKENS_PER_MINUTE = 120; // allow 120 requests per minute
const BURST = 60; // additional burst capacity

function refill(bucket: { tokens: number; lastRefill: number }) {
	const now = Date.now();
	const elapsedMs = now - bucket.lastRefill;
	const tokensToAdd = (elapsedMs / 60000) * TOKENS_PER_MINUTE;
	bucket.tokens = Math.min(TOKENS_PER_MINUTE + BURST, bucket.tokens + tokensToAdd);
	bucket.lastRefill = now;
}

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
	const key = req.ip || 'unknown';
	let bucket = rateLimitState.get(key);
	if (!bucket) {
		bucket = { tokens: TOKENS_PER_MINUTE + BURST, lastRefill: Date.now() };
		rateLimitState.set(key, bucket);
	}
	refill(bucket);
	if (bucket.tokens < 1) return res.status(429).json({ error: 'rate_limited' });
	bucket.tokens -= 1;
	return next();
}

