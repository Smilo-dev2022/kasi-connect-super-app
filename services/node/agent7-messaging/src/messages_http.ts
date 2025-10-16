import { Router, Request, Response } from 'express';
import { eventLog, messageLog, groupIdToGroup } from './state';

export const getMissedMessagesRouter = Router();

getMissedMessagesRouter.get('/since/:ts', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const since = Number(req.params.ts || 0);
	const userId = req.user.userId;
	const messages = messageLog.filter((m) => {
		if (m.timestamp <= since) return false;
		if (m.to === userId || m.from === userId) return true;
		if (m.scope === 'group') {
			const group = groupIdToGroup.get(String(m.to));
			return !!group && group.memberIds.has(userId);
		}
		return false;
	});
	const events = eventLog.filter((e) => e.timestamp > since);
	res.json({ messages, events });
});