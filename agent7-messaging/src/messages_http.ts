import { Router, Request, Response } from 'express';
import { eventLog, messageLog, groupIdToGroup, deliveredByMessageId, readByMessageId } from './state';

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
	const delivered: Record<string, string[]> = {};
	const read: Record<string, string[]> = {};
	for (const m of messages) {
		const d = deliveredByMessageId.get(m.id);
		if (d) delivered[m.id] = [...d];
		const r = readByMessageId.get(m.id);
		if (r) read[m.id] = [...r];
	}
	res.json({ messages, events, receipts: { delivered, read } });
});

// Simple mark-delivered and mark-read via HTTP
export const receiptsRouter = Router();

receiptsRouter.post('/delivered/:messageId', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const messageId = req.params.messageId;
	const set = deliveredByMessageId.get(messageId) || new Set<string>();
	set.add(req.user.userId);
	deliveredByMessageId.set(messageId, set);
	return res.json({ ok: true, messageId });
});

receiptsRouter.post('/read/:messageId', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const messageId = req.params.messageId;
	const set = readByMessageId.get(messageId) || new Set<string>();
	set.add(req.user.userId);
	readByMessageId.set(messageId, set);
	return res.json({ ok: true, messageId });
});