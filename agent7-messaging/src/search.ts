import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { groupIdToGroup, messageLog } from './state';

export const searchRouter = Router();

const Query = z.object({
    q: z.string().min(1),
    scope: z.enum(['messages','groups']).default('messages'),
    group_id: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
});

searchRouter.get('/', (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const parsed = Query.safeParse({ ...req.query });
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { q, scope, group_id, limit } = parsed.data;

    if (scope === 'groups') {
        const items = [...groupIdToGroup.values()]
            .filter(g => (g.name || '').toLowerCase().includes(q.toLowerCase()))
            .slice(0, limit)
            .map(g => ({ type: 'group', group: { id: g.groupId, name: g.name } }));
        return res.json({ items });
    }

    // messages
    const ql = q.toLowerCase();
    const items = messageLog
        .filter(m => (!group_id || String(m.to) === group_id) && (m.contentType === 'text/plain' || !m.contentType))
        .filter(m => (m.ciphertext || '').toLowerCase().includes(ql))
        .slice(-1000)
        .reverse()
        .slice(0, limit)
        .map(m => ({ type: 'message', message: { id: m.id, group_id: m.scope === 'group' ? m.to : undefined, text: m.ciphertext, created_at: new Date(m.timestamp).toISOString() } }));
    return res.json({ items });
});

