import { Router } from 'express';
import { z } from 'zod';
import { getRedisClient } from '../redis';
import { authenticator } from 'otplib';
import { config } from '../config';
import { createRateLimiter } from '../rateLimit';

const router = Router();

// Make OTP code valid for the full configured TTL window
authenticator.options = { step: config.otp.codeTtlSeconds } as any;

const otpRequestLimiter = createRateLimiter(config.otp.maxRequestsPerHour, 60 * 60, 'rl:otp:req');
const otpVerifyLimiter = createRateLimiter(Math.max(config.otp.maxRequestsPerHour * 2, 10), 60 * 60, 'rl:otp:ver');

const BodyRequest = z.object({
  phone: z.string().min(6).max(20).or(z.string().email())
});

router.post('/request', async (req, res, next) => {
  try {
    const body = BodyRequest.parse(req.body);
    const key = `otp:${body.phone}`;
    const redis = getRedisClient();

    const rateKey = `req:${body.phone}`;
    await otpRequestLimiter.consume(rateKey);

    const secret = authenticator.generateSecret();
    const code = authenticator.generate(secret).slice(-6);

    await redis.setex(key, config.otp.codeTtlSeconds, JSON.stringify({ secret }));

    res.json({ success: true, ttl: config.otp.codeTtlSeconds, channel: 'mock', code });
  } catch (err: any) {
    if (err && err.msBeforeNext) {
      return res.status(429).json({ error: 'Too Many Requests', retryAfterMs: err.msBeforeNext });
    }
    return next(err);
  }
});

const BodyVerify = z.object({
  phone: z.string().min(6).max(20).or(z.string().email()),
  code: z.string().min(4).max(10)
});

router.post('/verify', async (req, res, next) => {
  try {
    const body = BodyVerify.parse(req.body);
    const key = `otp:${body.phone}`;
    const redis = getRedisClient();

    const rateKey = `ver:${body.phone}`;
    await otpVerifyLimiter.consume(rateKey);

    const record = await redis.get(key);
    if (!record) return res.status(400).json({ error: 'OTP expired or not found' });

    const { secret } = JSON.parse(record) as { secret: string };
    const isValid = authenticator.check(body.code, secret);
    if (!isValid) return res.status(400).json({ error: 'Invalid code' });

    await redis.del(key);
    res.json({ success: true });
  } catch (err: any) {
    if (err && err.msBeforeNext) {
      return res.status(429).json({ error: 'Too Many Requests', retryAfterMs: err.msBeforeNext });
    }
    return next(err);
  }
});

export default router;

