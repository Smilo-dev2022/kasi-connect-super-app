import { Router, Request, Response } from 'express';
import { messageLog } from './state';

export const getMissedMessagesRouter = Router();

getMissedMessagesRouter.get('/since/:ts', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const since = Number(req.params.ts || 0);
	const messages = messageLog.filter((m) => m.timestamp > since && (m.to === req.user!.userId || m.from === req.user!.userId || m.scope === 'group'));
	res.json({ messages });
});