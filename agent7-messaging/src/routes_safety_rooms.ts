import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Group, groupIdToGroup, userIdToVerifiedWard } from './state';
import { v4 as uuidv4 } from 'uuid';

export const safetyRoomsRouter = Router();

const CreateSafetyRoomBody = z.object({ name: z.string().default('Safety Room'), ward: z.string().min(1) });

safetyRoomsRouter.post('/rooms', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CreateSafetyRoomBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	// Only verified ward admins can create a safety room for their ward
	const verifiedWard = userIdToVerifiedWard.get(req.user.userId);
	if (verifiedWard !== parsed.data.ward) return res.status(403).json({ error: 'forbidden' });
	const groupId = uuidv4();
	const group: Group = {
		groupId,
		name: parsed.data.name,
		ownerId: req.user.userId,
		memberIds: new Set([req.user.userId]),
		createdAt: Date.now(),
		isSafetyRoom: true,
		ward: parsed.data.ward,
		verifiedCPF: true,
	};
	groupIdToGroup.set(groupId, group);
	return res.json({ groupId });
});

const JoinSafetyRoomBody = z.object({ ward: z.string().min(1) });

safetyRoomsRouter.post('/rooms/:groupId/join', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = JoinSafetyRoomBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group || !group.isSafetyRoom) return res.status(404).json({ error: 'not found' });
	// Basic ward check: allow if user's verified ward matches room ward, or room does not strictly require it (future flag)
	if (group.ward && userIdToVerifiedWard.get(group.ownerId) !== group.ward && userIdToVerifiedWard.get(req.user.userId) !== group.ward) {
		return res.status(403).json({ error: 'ward-mismatch' });
	}
	group.memberIds.add(req.user.userId);
	return res.json({ ok: true, groupId: group.groupId, members: [...group.memberIds] });
});

safetyRoomsRouter.get('/rooms/:groupId', (req: Request, res: Response) => {
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group || !group.isSafetyRoom) return res.status(404).json({ error: 'not found' });
	return res.json({
		groupId: group.groupId,
		name: group.name,
		ownerId: group.ownerId,
		members: [...group.memberIds],
		createdAt: group.createdAt,
		isSafetyRoom: group.isSafetyRoom,
		ward: group.ward,
		verifiedCPF: group.verifiedCPF,
	});
});

