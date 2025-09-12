import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { redis } from '../redis';
import { requireJwt } from '../jwt';
import { ulid } from 'ulid';

const router = Router();

const CreateDeviceBody = z.object({
  platform: z.enum(['ios', 'android', 'web']),
  token: z.string().min(1)
});

router.post('/', requireJwt, async (req: Request, res: Response) => {
  const parsed = CreateDeviceBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { platform, token } = parsed.data;
  const userId = req.user!.sub;
  const deviceId = ulid();
  await redis.hset(`device:${deviceId}`, {
    id: deviceId,
    user_id: userId,
    platform,
    token,
    created_at: new Date().toISOString()
  });
  await redis.sadd(`user:${userId}:devices`, deviceId);
  return res.status(201).json({ id: deviceId, user_id: userId, platform, token });
});

router.delete('/:id', requireJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.sub;
  const device = await redis.hgetall(`device:${id}`);
  if (!device || device.user_id !== userId) return res.status(404).json({ error: 'Not found' });
  await redis.del(`device:${id}`);
  await redis.srem(`user:${userId}:devices`, id);
  return res.status(204).send();
});

export default router;

