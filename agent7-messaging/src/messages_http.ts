import { Router, Request, Response } from 'express';
import { eventLog, messageLog } from './state';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

export const getMissedMessagesRouter = Router();

getMissedMessagesRouter.get('/since/:ts', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const since = Number(req.params.ts || 0);
	const messages = messageLog.filter((m) => m.timestamp > since && (m.to === req.user!.userId || m.from === req.user!.userId || m.scope === 'group'));
	res.json({ messages });
});

// Return events since a timestamp to sync reactions/edits/deletes/replies
getMissedMessagesRouter.get('/events/since/:ts', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const since = Number(req.params.ts || 0);
	const events = eventLog.filter((e) => e.timestamp > since && (e.to === req.user!.userId || e.from === req.user!.userId || e.scope === 'group'));
	res.json({ events });
});

// Accept event creation for offline mode fallback (HTTP) when WS is unavailable
const CreateEventBody = z.object({
	to: z.string().min(1),
	scope: z.enum(['direct', 'group']),
	eventType: z.enum(['reaction', 'edit', 'delete', 'reply']),
	messageId: z.string().min(1),
	reaction: z.string().optional(),
	ciphertext: z.string().optional(),
	timestamp: z.number().optional(),
});

getMissedMessagesRouter.post('/events', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CreateEventBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const now = Date.now();
	const evt = {
		id: uuidv4(),
		eventType: parsed.data.eventType,
		from: req.user.userId,
		to: parsed.data.to,
		scope: parsed.data.scope,
		messageId: parsed.data.messageId,
		reaction: parsed.data.reaction,
		ciphertext: parsed.data.ciphertext,
		timestamp: parsed.data.timestamp || now,
	};
	eventLog.push(evt as any);
	res.json({ ok: true, id: evt.id, timestamp: evt.timestamp });
});