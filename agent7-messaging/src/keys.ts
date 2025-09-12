import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { IdentityRecord, OneTimePreKey, userIdToIdentity, userIdToPrekeys, keyTransparencyLog } from './state';

export const keysRouter = Router();

const IdentityBody = z.object({ identityKey: z.string().min(16), signedPreKey: z.string().min(16).optional() });

keysRouter.post('/identity', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = IdentityBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const record: IdentityRecord = {
		userId: req.user.userId,
		identityKey: parsed.data.identityKey,
		signedPreKey: parsed.data.signedPreKey,
		updatedAt: Date.now(),
	};
	userIdToIdentity.set(req.user.userId, record);
	const history = keyTransparencyLog.get(req.user.userId) || [];
	history.push(record);
	keyTransparencyLog.set(req.user.userId, history);
	return res.json({ ok: true });
});

const PreKeysBody = z.object({ oneTimePreKeys: z.array(z.object({ keyId: z.string().min(1), publicKey: z.string().min(16) })).min(1) });

keysRouter.post('/prekeys', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = PreKeysBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const existing = userIdToPrekeys.get(req.user.userId) || [];
	userIdToPrekeys.set(req.user.userId, existing.concat(parsed.data.oneTimePreKeys as OneTimePreKey[]));
	return res.json({ count: userIdToPrekeys.get(req.user.userId)?.length || 0 });
});

keysRouter.get('/prekeys/:userId', (req: Request, res: Response) => {
	const targetId = req.params.userId;
	const list = userIdToPrekeys.get(targetId) || [];
	const one = list.shift();
	if (!one) return res.status(404).json({ error: 'no prekeys available' });
	userIdToPrekeys.set(targetId, list);
	const identity = userIdToIdentity.get(targetId);
	return res.json({ identityKey: identity?.identityKey, signedPreKey: identity?.signedPreKey, oneTimePreKey: one });
});

// Key transparency history (append-only)
keysRouter.get('/transparency/:userId', (_req: Request, res: Response) => {
	const userId = String(_req.params.userId);
	const history = keyTransparencyLog.get(userId) || [];
	return res.json({ userId, history });
});