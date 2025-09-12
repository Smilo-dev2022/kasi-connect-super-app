import { Router, Request, Response } from 'express';
import { userIdToPresence } from './state';

export const presenceRouter = Router();

presenceRouter.get('/me', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const p = userIdToPresence.get(req.user.userId) || { online: false, lastSeen: 0 };
	return res.json({ userId: req.user.userId, ...p });
});

presenceRouter.get('/:userId', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const p = userIdToPresence.get(req.params.userId) || { online: false, lastSeen: 0 };
	return res.json({ userId: req.params.userId, ...p });
});

presenceRouter.post('/heartbeat', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const now = Date.now();
	const existing = userIdToPresence.get(req.user.userId);
	userIdToPresence.set(req.user.userId, { online: !!existing?.online, lastSeen: now });
	return res.json({ ok: true, lastSeen: now });
});

