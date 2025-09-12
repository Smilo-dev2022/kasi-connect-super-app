import type { FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { z } from 'zod';
import { config } from '../config';
import { signAuthToken } from '../jwt';
import { randomInt, createHash } from 'crypto';
import type { KeyValueStore } from '../kv';

declare module 'fastify' {
  interface FastifyInstance {
    kv: KeyValueStore;
  }
}

function generateOtp(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += String(randomInt(0, 10));
  }
  return code;
}

function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

function hashToUserId(identifier: string): string {
  const h = createHash('sha256').update(identifier).digest('hex').slice(0, 24);
  return `u_${h}`;
}

const requestSchema = z.object({
  identifier: z.string().min(3).max(200),
  channel: z.enum(['sms', 'email']).default('sms'),
});

const verifySchema = z.object({
  identifier: z.string().min(3).max(200),
  code: z.string().min(4).max(10),
});

const plugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.post(
    '/auth/otp/request',
    {
      config: { rateLimit: { max: 10, timeWindow: 60_000 } },
    },
    async (request, reply) => {
      const parse = requestSchema.safeParse(request.body);
      if (!parse.success) {
        reply.code(400).send({ error: 'Bad request' });
        return;
      }
      const { identifier } = parse.data;
      const id = normalizeIdentifier(identifier);
      const kv = fastify.kv;

      const coolKey = `otp:cool:${id}`;
      const dailyKey = `otp:daily:${id}`;
      const lockKey = `otp:lock:${id}`;
      const codeKey = `otp:code:${id}`;

      if (await kv.get(lockKey)) {
        reply.code(429).send({ error: 'Too many requests' });
        return;
      }

      if (await kv.get(coolKey)) {
        reply.code(429).send({ error: 'Please wait before requesting another code' });
        return;
      }

      const dailyCountStr = await kv.get(dailyKey);
      const dailyCount = dailyCountStr ? Number(dailyCountStr) : 0;
      if (dailyCount >= config.otp.maxPerDay) {
        reply.code(429).send({ error: 'Daily limit reached' });
        return;
      }

      const code = generateOtp(config.otp.length);
      await kv.set(codeKey, code, config.otp.ttlSeconds);
      await kv.set(coolKey, '1', config.otp.resendSeconds);
      const next = (await kv.incr(dailyKey));
      if (next === 1) {
        // set a 24h TTL on first increment
        await kv.set(dailyKey, String(next), 24 * 60 * 60);
      }

      request.log.info({ identifier: id, code }, 'OTP generated');
      reply.send({ success: true, expires_in: config.otp.ttlSeconds, resend_after: config.otp.resendSeconds });
    }
  );

  fastify.post(
    '/auth/otp/verify',
    {
      config: { rateLimit: { max: 20, timeWindow: 60_000 } },
    },
    async (request, reply) => {
      const parse = verifySchema.safeParse(request.body);
      if (!parse.success) {
        reply.code(400).send({ error: 'Bad request' });
        return;
      }
      const { identifier, code } = parse.data;
      const id = normalizeIdentifier(identifier);
      const kv = fastify.kv;

      const lockKey = `otp:lock:${id}`;
      const codeKey = `otp:code:${id}`;
      const attemptsKey = `otp:attempts:${id}`;

      if (await kv.get(lockKey)) {
        reply.code(429).send({ error: 'Locked. Try later.' });
        return;
      }

      const stored = await kv.get(codeKey);
      if (!stored) {
        reply.code(400).send({ error: 'Invalid or expired code' });
        return;
      }

      if (stored !== code) {
        const attempts = await kv.incr(attemptsKey);
        if (attempts === 1) {
          await kv.set(attemptsKey, String(attempts), 15 * 60);
        }
        if (attempts >= config.otp.maxVerifyAttempts) {
          await kv.set(lockKey, '1', config.otp.lockoutMinutes * 60);
        }
        reply.code(400).send({ error: 'Invalid code' });
        return;
      }

      await kv.del(codeKey);
      await kv.del(attemptsKey);

      const userId = hashToUserId(id);
      const token = await signAuthToken({ userId });
      reply.send({ token, user_id: userId, token_type: 'Bearer', expires_in: 30 * 24 * 60 * 60 });
    }
  );

  done();
};

export default fp(plugin);

