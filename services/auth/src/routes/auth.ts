import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { redis } from '../redis';
import { signToken, signRefreshToken, verifyRefreshToken } from '../jwt';
import { createHash, timingSafeEqual } from 'node:crypto';
import { ulid } from 'ulid';

const router = Router();

const DevTokenBody = z.object({ userId: z.string().min(1), name: z.string().optional() });

router.post('/dev-token', (req: Request, res: Response) => {
  const parsed = DevTokenBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const token = signToken({ sub: parsed.data.userId, name: parsed.data.name });
  const refresh = signRefreshToken({ sub: parsed.data.userId, name: parsed.data.name });
  return res.json({ token, refresh });
});

function hashOtp(code: string): string {
  return createHash('sha256').update(`${code}:${config.otpPepper}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

const OtpRequestBody = z.object({
  channel: z.enum(['sms', 'email']),
  to: z.string().min(3)
});

router.post('/otp/request', async (req: Request, res: Response) => {
  const parsed = OtpRequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { channel, to } = parsed.data;
  const normalizedKey = `${channel}:${to.toLowerCase()}`;
  const cooldownKey = `otp:cooldown:${normalizedKey}`;
  const otpKey = `otp:code:${normalizedKey}`;

  const isCooling = await redis.exists(cooldownKey);
  if (isCooling) return res.status(429).json({ error: 'Too Many Requests' });

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const digest = hashOtp(code);
  await redis
    .multi()
    .hset(otpKey, { digest, attempts: '0' })
    .expire(otpKey, config.otpTtlSeconds)
    .set(cooldownKey, '1', 'EX', config.otpCooldownSeconds)
    .exec();

  // TODO: integrate provider; for now log to console (do not expose in response)
  // eslint-disable-next-line no-console
  console.log('OTP issued', { channel, to, code });
  return res.status(200).json({ status: 'sent' });
});

const OtpVerifyBody = z.object({
  channel: z.enum(['sms', 'email']),
  to: z.string().min(3),
  code: z.string().min(4).max(8),
  device: z
    .object({ platform: z.enum(['ios', 'android', 'web']), token: z.string().min(1) })
    .optional()
});

router.post('/otp/verify', async (req: Request, res: Response) => {
  const parsed = OtpVerifyBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { channel, to, code, device } = parsed.data;
  const normalizedKey = `${channel}:${to.toLowerCase()}`;
  const otpKey = `otp:code:${normalizedKey}`;
  const data = await redis.hgetall(otpKey);
  if (!data || !data.digest) return res.status(400).json({ error: 'Invalid or expired code' });

  const attempts = Number(data.attempts || '0');
  if (attempts >= config.otpMaxAttempts) {
    await redis.del(otpKey);
    return res.status(429).json({ error: 'Too many attempts' });
  }

  const isValid = safeEqual(hashOtp(code), data.digest);
  if (!isValid) {
    await redis.hincrby(otpKey, 'attempts', 1);
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  await redis.del(otpKey);

  // Map contact to user id
  const userIdKey = `user:id:${normalizedKey}`;
  let userId = await redis.get(userIdKey);
  if (!userId) {
    userId = ulid();
    await redis.set(userIdKey, userId);
  }

  if (device) {
    const deviceId = ulid();
    await redis.hset(`device:${deviceId}`, {
      id: deviceId,
      user_id: userId,
      platform: device.platform,
      token: device.token,
      created_at: new Date().toISOString()
    });
    await redis.sadd(`user:${userId}:devices`, deviceId);
  }

  const token = signToken({ sub: userId as string });
  const refresh = signRefreshToken({ sub: userId as string });
  return res.json({ token, refresh });
});

const RefreshBody = z.object({ refresh: z.string().min(10) });
router.post('/refresh', (req: Request, res: Response) => {
  const parsed = RefreshBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const payload = verifyRefreshToken(parsed.data.refresh);
  if (!payload) return res.status(401).json({ error: 'invalid_refresh' });
  const token = signToken({ sub: payload.sub!, name: payload.name });
  const refresh = signRefreshToken({ sub: payload.sub!, name: payload.name });
  return res.json({ token, refresh });
});

export default router;

