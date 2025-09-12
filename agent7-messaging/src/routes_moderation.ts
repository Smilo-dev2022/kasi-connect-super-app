import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { classifyContent } from './moderation';

export const moderationRouter = Router();

const SubmitBody = z.object({
	reporterId: z.string().optional(),
	targetId: z.string().min(1),
	content: z.string().min(1),
	contentType: z.enum(['message', 'image', 'profile', 'room']),
	context: z.string().optional(),
});

// In-memory queue in this service for demo
type Item = {
	id: string;
	targetId: string;
	contentSnippet: string;
	contentType: 'message' | 'image' | 'profile' | 'room';
	category: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	status: 'pending' | 'reviewed' | 'escalated' | 'resolved';
	createdAt: number;
};

const queue: Item[] = [];

moderationRouter.post('/report', async (req: Request, res: Response) => {
	const parsed = SubmitBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const cls = await classifyContent(parsed.data.content);
	const item: Item = {
		id: `mod_${Math.random().toString(36).slice(2, 10)}`,
		targetId: parsed.data.targetId,
		contentSnippet: parsed.data.content.slice(0, 160),
		contentType: parsed.data.contentType,
		category: cls.category,
		severity: cls.severity,
		status: 'pending',
		createdAt: Date.now(),
	};
	queue.unshift(item);
	return res.json({ ok: true, id: item.id });
});

moderationRouter.get('/queue', (_req: Request, res: Response) => {
	return res.json({ items: queue });
});

moderationRouter.post('/queue/:id/status', (req: Request, res: Response) => {
	const id = req.params.id;
	const status = String(req.body?.status);
	if (!['pending', 'reviewed', 'escalated', 'resolved'].includes(status)) return res.status(400).json({ error: 'bad-status' });
	const idx = queue.findIndex((q) => q.id === id);
	if (idx === -1) return res.status(404).json({ error: 'not-found' });
	queue[idx] = { ...queue[idx], status: status as Item['status'] };
	return res.json({ ok: true, item: queue[idx] });
});

