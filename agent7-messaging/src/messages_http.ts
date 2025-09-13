import { Router, Request, Response } from 'express';
import { eventLog, messageLog, groupIdToGroup } from './state';
import { createRepos } from './repos';

const USE_DB = (process.env.USE_DB || '').toLowerCase() === 'true';
const repos = USE_DB ? createRepos() : null;

export const getMissedMessagesRouter = Router();

getMissedMessagesRouter.get('/since/:conversationId', async (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const conversationId = String(req.params.conversationId);
	const sinceIso = (req.query.since as string | undefined) || null;
	const limit = Math.min(200, parseInt(String(req.query.limit || '100'), 10));
	const cursor = (req.query.cursor as string | undefined) || null;

	if (USE_DB && repos) {
		try {
			const { messages, next_cursor } = await repos.messages.listSince(conversationId, sinceIso, limit, cursor);
			return res.json({ messages, next_cursor });
		} catch (e) {
			return res.status(500).json({ error: 'db_read_failed' });
		}
	}

	// In-memory fallback keeps previous behavior using timestamp
	const since = Number(sinceIso || 0);
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
	res.json({ messages });
});