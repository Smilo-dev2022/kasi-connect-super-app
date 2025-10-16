import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { redis } from '../redis.js';

export default async function devicesPlugin(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  const CreateDeviceBody = z.object({ platform: z.enum(['ios', 'android', 'web']), token: z.string().min(1) });

  app.post('/devices', { preHandler: app.authenticate as any }, async (request, reply) => {
    const parsed = CreateDeviceBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { platform, token } = parsed.data as any;
    const user = (request as any).user as { userId: string };
    const deviceId = Math.random().toString(36).slice(2, 10);
    await redis.hset(`device:${deviceId}`, {
      id: deviceId,
      user_id: user.userId,
      platform,
      token,
      created_at: new Date().toISOString(),
    });
    await redis.sadd(`user:${user.userId}:devices`, deviceId);
    return reply.code(201).send({ id: deviceId, user_id: user.userId, platform, token });
  });

  app.delete('/devices/:id', { preHandler: app.authenticate as any }, async (request, reply) => {
    const { id } = request.params as any;
    const user = (request as any).user as { userId: string };
    const device = await redis.hgetall(`device:${id}`);
    if (!device || device.user_id !== user.userId) return reply.code(404).send({ error: 'Not found' });
    await redis.del(`device:${id}`);
    await redis.srem(`user:${user.userId}:devices`, id);
    return reply.code(204).send();
  });
}
