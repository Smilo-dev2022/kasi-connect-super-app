import { FastifyInstance } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import Redis from 'ioredis';
import { ulid } from 'ulidx';

interface DevicePayload {
  platform: 'ios' | 'android' | 'web';
  token: string;
}

function createOtpDigest(code: string, pepper: string): string {
  const crypto = require('node:crypto');
  return crypto.createHash('sha256').update(`${code}:${pepper}`).digest('hex');
}

export default fastifyPlugin(async function authModule(app: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new (Redis as any)(redisUrl, { maxRetriesPerRequest: 1, enableReadyCheck: false, lazyConnect: true });

  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  if (!app.hasRequestDecorator('jwt')) {
    await app.register((await import('@fastify/jwt')).default, {
      secret: JWT_SECRET,
      sign: { expiresIn: '7d' }
    });
  }

  const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 300);
  const OTP_COOLDOWN_SECONDS = Number(process.env.OTP_COOLDOWN_SECONDS || 60);
  const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
  const OTP_PEPPER = process.env.OTP_PEPPER || 'dev-otp-pepper-change-me';

  const authLoginCounter = new app.metrics.client.Counter({
    name: 'auth_login_total',
    help: 'Total login attempts',
    labelNames: ['result'] as const,
    registers: [app.metrics.registry]
  });

  app.post('/auth/dev-token', {
    schema: {
      body: {
        type: 'object',
        properties: { user: { type: 'string' } }
      },
      querystring: {
        type: 'object',
        properties: { user: { type: 'string' } }
      }
    }
  }, async (request, reply) => {
    const userFromBody = (request.body as any)?.user;
    const userFromQuery = (request.query as any)?.user;
    const userId = userFromBody || userFromQuery || ulid();
    const token = await reply.jwtSign({ sub: userId });
    authLoginCounter.labels('dev').inc();
    return reply.send({ token });
  });

  app.post('/auth/otp/request', {
    schema: {
      body: {
        type: 'object',
        required: ['channel', 'to'],
        properties: {
          channel: { type: 'string', enum: ['sms', 'email'] },
          to: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    const { channel, to } = request.body as { channel: 'sms'|'email'; to: string };
    const normalizedKey = `${channel}:${to.toLowerCase()}`;
    const cooldownKey = `otp:cooldown:${normalizedKey}`;
    const otpKey = `otp:code:${normalizedKey}`;

    const isCooling = await redis.exists(cooldownKey);
    if (isCooling) {
      authLoginCounter.labels('cooldown').inc();
      return reply.code(429).send({ error: 'Too Many Requests' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const digest = createOtpDigest(code, OTP_PEPPER);
    await redis.multi()
      .hset(otpKey, { digest, attempts: '0' })
      .expire(otpKey, OTP_TTL_SECONDS)
      .set(cooldownKey, '1', 'EX', OTP_COOLDOWN_SECONDS)
      .exec();

    app.log.info({ channel, to, code }, 'OTP issued');
    authLoginCounter.labels('issued').inc();
    return reply.code(200).send({ status: 'sent' });
  });

  app.post('/auth/otp/verify', {
    schema: {
      body: {
        type: 'object', required: ['channel','to','code'],
        properties: {
          channel: { type: 'string', enum: ['sms','email'] },
          to: { type: 'string' },
          code: { type: 'string' },
          device: {
            type: 'object',
            required: ['platform', 'token'],
            properties: {
              platform: { type: 'string', enum: ['ios','android','web'] },
              token: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { channel, to, code, device } = request.body as any;
    const normalizedKey = `${channel}:${to.toLowerCase()}`;
    const otpKey = `otp:code:${normalizedKey}`;
    const data = await redis.hgetall(otpKey);
    if (!data || !data.digest) {
      authLoginCounter.labels('invalid').inc();
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }
    const attempts = Number(data.attempts || '0');
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await redis.del(otpKey);
      authLoginCounter.labels('locked').inc();
      return reply.code(429).send({ error: 'Too many attempts' });
    }
    const isValid = createOtpDigest(code, OTP_PEPPER) === data.digest;
    if (!isValid) {
      await redis.hincrby(otpKey, 'attempts', 1);
      authLoginCounter.labels('bad_code').inc();
      return reply.code(400).send({ error: 'Invalid or expired code' });
    }

    await redis.del(otpKey);

    const userIdKey = `user:id:${normalizedKey}`;
    let userId = await redis.get(userIdKey);
    if (!userId) {
      userId = ulid();
      await redis.set(userIdKey, userId);
    }

    const token = await reply.jwtSign({ sub: userId });

    if (device) {
      const deviceId = ulid();
      await redis.hset(`device:${deviceId}`, {
        id: deviceId,
        user_id: userId,
        platform: (device as DevicePayload).platform,
        token: (device as DevicePayload).token,
        created_at: new Date().toISOString()
      });
      await redis.sadd(`user:${userId}:devices`, deviceId);
    }

    authLoginCounter.labels('success').inc();
    return reply.send({ token });
  });

  app.get('/me', { preHandler: async (req, reply) => {
    try { await (req as any).jwtVerify(); } catch { return reply.code(401).send({ error: 'Unauthorized' }); }
  }}, async (req) => {
    const user = (req as any).user as { sub: string };
    return { sub: user.sub };
  });
});
