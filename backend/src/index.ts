import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import Redis from 'ioredis';
import { ulid } from 'ulid';
import { createHash, timingSafeEqual } from 'node:crypto';

const server = Fastify({ logger: true });
// Security headers
server.register(fastifyHelmet, {
  contentSecurityPolicy: false
});
// Enforce HTTPS behind proxy if enabled
const enforceHttps = (process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true';
if (enforceHttps) {
  server.addHook('onRequest', async (req, reply) => {
    const upgrade = String(req.headers['upgrade'] || '').toLowerCase();
    if (upgrade === 'websocket') return;
    const proto = req.headers['x-forwarded-proto'] as string | undefined;
    if (proto !== 'https') {
      const host = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string);
      reply.redirect(308, `https://${host}${req.url}`);
    }
  });
}
server.register(websocket);
server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Env
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const OTP_TTL_SECONDS = Number(process.env.OTP_TTL_SECONDS || 300);
const OTP_COOLDOWN_SECONDS = Number(process.env.OTP_COOLDOWN_SECONDS || 60);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_PEPPER = process.env.OTP_PEPPER || 'dev-otp-pepper-change-me';

// Redis
const redis = new Redis(REDIS_URL);
redis.on('error', (err: unknown) => server.log.error({ err }, 'Redis error'));

// JWT
server.register(fastifyJwt, {
  secret: JWT_SECRET,
  sign: {
    expiresIn: '7d'
  }
});

async function requireAuth(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

function hashOtp(code: string): string {
  return createHash('sha256').update(`${code}:${OTP_PEPPER}`).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

server.get('/health', async () => {
  return { ok: true };
});
// OTP request
server.post('/auth/otp/request', {
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
    return reply.code(429).send({ error: 'Too Many Requests' });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  // Store hashed OTP and attempts
  const digest = hashOtp(code);
  await redis.multi()
    .hset(otpKey, {
      digest,
      attempts: '0'
    })
    .expire(otpKey, OTP_TTL_SECONDS)
    .set(cooldownKey, '1', 'EX', OTP_COOLDOWN_SECONDS)
    .exec();

  // TODO: integrate with sms/email provider, for now log
  server.log.info({ channel, to, code }, 'OTP issued');
  return reply.code(200).send({ status: 'sent' });
});

// OTP verify
server.post('/auth/otp/verify', {
  schema: {
    body: {
      type: 'object',
      required: ['channel', 'to', 'code'],
      properties: {
        channel: { type: 'string', enum: ['sms', 'email'] },
        to: { type: 'string' },
        code: { type: 'string', minLength: 4, maxLength: 8 },
        device: {
          type: 'object',
          required: ['platform', 'token'],
          properties: {
            platform: { type: 'string', enum: ['ios', 'android', 'web'] },
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
    return reply.code(400).send({ error: 'Invalid or expired code' });
  }
  const attempts = Number(data.attempts || '0');
  if (attempts >= OTP_MAX_ATTEMPTS) {
    await redis.del(otpKey);
    return reply.code(429).send({ error: 'Too many attempts' });
  }
  const isValid = safeEqual(hashOtp(code), data.digest);
  if (!isValid) {
    await redis.hincrby(otpKey, 'attempts', 1);
    return reply.code(400).send({ error: 'Invalid or expired code' });
  }

  // One-time use
  await redis.del(otpKey);

  // Create user if needed
  const userIdKey = `user:id:${normalizedKey}`;
  let userId = await redis.get(userIdKey);
  if (!userId) {
    userId = ulid();
    await redis.set(userIdKey, userId);
  }

  // Issue JWT
  const token = await reply.jwtSign({ sub: userId });

  // Optionally store device
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

  return reply.send({ token });
});

// Authenticated device registration
server.post('/devices', { preHandler: requireAuth, schema: {
  body: {
    type: 'object',
    required: ['platform', 'token'],
    properties: {
      platform: { type: 'string', enum: ['ios', 'android', 'web'] },
      token: { type: 'string' }
    }
  }
}}, async (request, reply) => {
  const user = (request as any).user as { sub: string };
  const { platform, token } = request.body as any;
  const deviceId = ulid();
  await redis.hset(`device:${deviceId}`, {
    id: deviceId,
    user_id: user.sub,
    platform,
    token,
    created_at: new Date().toISOString()
  });
  await redis.sadd(`user:${user.sub}:devices`, deviceId);
  return reply.code(201).send({ id: deviceId, user_id: user.sub, platform, token });
});

// Authenticated device unregister
server.delete('/devices/:id', { preHandler: requireAuth }, async (request, reply) => {
  const user = (request as any).user as { sub: string };
  const { id } = request.params as any;
  const device = await redis.hgetall(`device:${id}`);
  if (!device || device.user_id !== user.sub) {
    return reply.code(404).send({ error: 'Not found' });
  }
  await redis.del(`device:${id}`);
  await redis.srem(`user:${user.sub}:devices`, id);
  return reply.code(204).send();
});

server.get('/ws', { websocket: true }, (connection /*, req */) => {
  connection.socket.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
  connection.socket.on('message', (raw: unknown) => {
    try {
      const message = JSON.parse(String(raw));
      // TODO: route to messaging service once implemented
      connection.socket.send(
        JSON.stringify({ type: 'echo', received: message, ts: Date.now() })
      );
    } catch {
      connection.socket.send(JSON.stringify({ type: 'error', error: 'Bad JSON' }));
    }
  });
});

async function start() {
  const port = Number(process.env.PORT || 4000);
  const host = process.env.HOST || '0.0.0.0';
  try {
    await server.listen({ port, host });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();
