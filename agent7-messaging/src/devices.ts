import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Device, DevicePlatform, deviceIdToDevice, userIdToDevices } from './state';
import { v4 as uuidv4 } from 'uuid';

export const devicesRouter = Router();

const RegisterBody = z.object({
    platform: z.enum(['ios', 'android', 'web']),
    token: z.string().min(10),
});

devicesRouter.post('/', (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const parsed = RegisterBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const id = uuidv4();
    const device: Device = {
        id,
        userId: req.user.userId,
        platform: parsed.data.platform as DevicePlatform,
        token: parsed.data.token,
        createdAt: Date.now(),
    };
    deviceIdToDevice.set(id, device);
    const list = userIdToDevices.get(req.user.userId) || [];
    list.push(device);
    userIdToDevices.set(req.user.userId, list);
    return res.status(201).json(device);
});

devicesRouter.delete('/:id', (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const id = req.params.id;
    const device = deviceIdToDevice.get(id);
    if (!device) return res.status(404).json({ error: 'not_found' });
    if (device.userId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
    deviceIdToDevice.delete(id);
    const list = (userIdToDevices.get(req.user.userId) || []).filter((d) => d.id !== id);
    userIdToDevices.set(req.user.userId, list);
    return res.status(204).send();
});

devicesRouter.get('/', (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: 'unauthorized' });
    const list = userIdToDevices.get(req.user.userId) || [];
    return res.json({ items: list });
});

