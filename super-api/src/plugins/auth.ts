import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { redis } from '../redis.js';

const DevTokenBody = z.object({ userId: z.string().min(1), name: z.string().optional() });
const OtpRequestBody = z.object({ channel: z.enum(['sms', 'email']), to: z.string().min(3) });
const OtpVerifyBody = z.object({
  channel: z.enum(['sms', 'email']),
  to: z.string().min(3),
  code: z.string().min(4).max(8),
  device: z
    .object({ platform: z.enum(['ios', 'android', 'web']), token: z.string().min(1) })
    .optional(),
});

function hashOtp(code: string): string {
  return createHash('sha256').update(`${code}:${config.otpPepper}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export default async function authPlugin(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // dev token endpoint
  app.post('/auth/dev-token', async (request, reply) => {
    if (config.nodeEnv === 'production') return reply.code(403).send({ error: 'endpoint disabled in production' });
    const parsed = DevTokenBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const token = await reply.jwtSign({ userId: parsed.data.userId, name: parsed.data.name }, { expiresIn: '7d' });
    return reply.send({ token });
  });

  app.post('/auth/otp/request', async (request, reply) => {
    const parsed = OtpRequestBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { channel, to } = parsed.data;
    const normalizedKey = `${channel}:${to.toLowerCase()}`;
    const cooldownKey = `otp:cooldown:${normalizedKey}`;
    const otpKey = `otp:code:${normalizedKey}`;

    const isCooling = await redis.exists(cooldownKey);
    if (isCooling) return reply.code(429).send({ error: 'Too Many Requests' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const digest = hashOtp(code);
    await redis
      .multi()
      .hset(otpKey, { digest, attempts: '0' })
      .expire(otpKey, config.otpTtlSeconds)
      .set(cooldownKey, '1', 'EX', config.otpCooldownSeconds)
      .exec();

    app.log.info({ channel, to, code }, 'OTP issued');
    return reply.send({ status: 'sent' });
  });

  app.post('/auth/otp/verify', async (request, reply) => {
    const parsed = OtpVerifyBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { channel, to, code, device } = parsed.data;
    const normalizedKey = `${channel}:${to.toLowerCase()}`;
    const otpKey = `otp:code:${normalizedKey}`;
    const data = await redis.hgetall(otpKey);
    if (!data || !data.digest) return reply.code(400).send({ error: 'Invalid or expired code' });

    const attempts = Number(data.attempts || '0');
    if (attempts >= config.otpMaxAttempts) {
      await redis.del(otpKey);
      return reply.code(429).send({ error: 'Too many attempts' });
    }

    const isValid = safeEqual(hashOtp(code), data.digest);
    if (!isValid) {
      await redis.hincrby(otpKey, 'attempts', 1);
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    await redis.del(otpKey);

    // Map contact to user id
    const userIdKey = `user:id:${normalizedKey}`;
    let userId = await redis.get(userIdKey);
    if (!userId) {
      userId = randomBytes(8).toString('hex');
      await redis.set(userIdKey, userId);
    }

    if (device) {
      const deviceId = randomBytes(8).toString('hex');
      await redis.hset(`device:${deviceId}`, {
        id: deviceId,
        user_id: userId,
        platform: device.platform,
        token: device.token,
        created_at: new Date().toISOString(),
      });
      await redis.sadd(`user:${userId}:devices`, deviceId);
    }

    const token = await reply.jwtSign({ userId });
    return reply.send({ token });
  });
}
