import { Router, Request, Response } from 'express';

type Conversation = {
  id: string;
  title?: string;
  participantIds: string[];
  createdAt: number;
  updatedAt: number;
};

const conversations = new Map<string, Conversation>();

export const conversationsRouter = Router();

conversationsRouter.get('/', (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const userId = req.user.userId;
  const list = Array.from(conversations.values()).filter(c => c.participantIds.includes(userId));
  res.json(list);
});

conversationsRouter.post('/', (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const { title, participantIds } = (req.body || {}) as Partial<Conversation>;
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const now = Date.now();
  const conv: Conversation = { id, title, participantIds: Array.isArray(participantIds) ? participantIds : [req.user.userId], createdAt: now, updatedAt: now };
  conversations.set(id, conv);
  res.status(201).json(conv);
});

conversationsRouter.patch('/:id', (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const id = req.params.id;
  const existing = conversations.get(id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { title, participantIds } = (req.body || {}) as Partial<Conversation>;
  const updated: Conversation = {
    ...existing,
    title: title ?? existing.title,
    participantIds: Array.isArray(participantIds) ? participantIds : existing.participantIds,
    updatedAt: Date.now(),
  };
  conversations.set(id, updated);
  res.json(updated);
});

conversationsRouter.delete('/:id', (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'unauthorized' });
  const id = req.params.id;
  conversations.delete(id);
  res.status(204).end();
});

