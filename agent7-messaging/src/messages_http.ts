import { Router, Request, Response } from 'express';
import { groupIdToGroup, messageLog } from './state';

export const getMissedMessagesRouter = Router();

getMissedMessagesRouter.get('/since/:ts', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const since = Number(req.params.ts || 0);
	const userId = req.user.userId;
	const messages = messageLog.filter((m) => {
		if (m.timestamp <= since) return false;
		if (m.scope === 'direct') {
			return m.to === userId || m.from === userId;
		}
		if (m.scope === 'group') {
			const group = groupIdToGroup.get(String(m.to));
			return !!group && group.memberIds.has(userId);
		}
		return false;
	});
	res.json({ messages });
});