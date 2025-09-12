import { Router } from 'express';
import { z } from 'zod';
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from '../jwt';
import { getRedisClient } from '../redis';
import crypto from 'crypto';
import { config } from '../config';

const router = Router();

const BodyLogin = z.object({
  userId: z.string().min(1),
});

router.post('/login', async (req, res, next) => {
  try {
    const body = BodyLogin.parse(req.body);
    const tokenId = crypto.randomUUID();
    const accessToken = signAccessToken(body.userId);
    const refreshToken = signRefreshToken(body.userId, tokenId);

    const redis = getRedisClient();
    const rtKey = `rt:${tokenId}`;
    const ttlSeconds = config.jwt.refreshTokenTtlSeconds;
    await redis.setex(rtKey, ttlSeconds, body.userId);

    res.json({ accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

const BodyRefresh = z.object({
  refreshToken: z.string().min(10)
});

router.post('/refresh', async (req, res, next) => {
  try {
    const body = BodyRefresh.parse(req.body);
    const payload = verifyRefreshToken(body.refreshToken);
    const redis = getRedisClient();

    const rtKey = `rt:${payload.tokenId}`;
    const userId = await redis.get(rtKey);
    if (!userId || userId !== payload.sub) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccess = signAccessToken(payload.sub);
    res.json({ accessToken: newAccess });
  } catch (err) {
    next(err);
  }
});

const BodyLogout = z.object({
  refreshToken: z.string().min(10)
});

router.post('/logout', async (req, res, next) => {
  try {
    const body = BodyLogout.parse(req.body);
    const payload = verifyRefreshToken(body.refreshToken);
    const redis = getRedisClient();
    const rtKey = `rt:${payload.tokenId}`;
    await redis.del(rtKey);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });
  const token = authHeader.replace(/^Bearer\s+/i, '');
  try {
    const payload = verifyAccessToken(token);
    res.json({ userId: payload.sub });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

