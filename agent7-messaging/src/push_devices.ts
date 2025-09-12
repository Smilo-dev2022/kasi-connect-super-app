import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { deviceIdToDevice, userIdToDevices } from './state';
import { v4 as uuidv4 } from 'uuid';

export const devicesRouter = Router();

const RegisterBody = z.object({ platform: z.enum(['ios','android','web']), token: z.string().min(8) });

devicesRouter.post('/', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = RegisterBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const id = uuidv4();
	const now = Date.now();
	const record = { id, userId: req.user.userId, platform: parsed.data.platform, token: parsed.data.token, lastSeenAt: now, createdAt: now };
	deviceIdToDevice.set(id, record);
	const set = userIdToDevices.get(req.user.userId) || new Set<string>();
	set.add(id);
	userIdToDevices.set(req.user.userId, set);
	return res.status(201).json(record);
});

devicesRouter.delete('/:id', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const id = req.params.id;
	const current = deviceIdToDevice.get(id);
	if (!current) return res.status(404).json({ error: 'not_found' });
	if (current.userId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	deviceIdToDevice.delete(id);
	const set = userIdToDevices.get(req.user.userId);
	if (set) { set.delete(id); userIdToDevices.set(req.user.userId, set); }
	return res.status(204).send();
});

devicesRouter.get('/', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const set = userIdToDevices.get(req.user.userId) || new Set();
	const devices = [...set].map((id) => deviceIdToDevice.get(id)).filter(Boolean);
	return res.json({ devices });
});

