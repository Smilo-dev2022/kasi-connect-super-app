import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Group, GroupId, GroupRole, groupIdToGroup, messageLog, userIdToGroups } from './state';
import { v4 as uuidv4 } from 'uuid';

export const safetyRouter = Router();

const CreateSafetyRoomBody = z.object({
	ward: z.string().min(1),
	name: z.string().default('Safety Room'),
	members: z.array(z.string()).default([])
});

safetyRouter.post('/rooms', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CreateSafetyRoomBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const groupId: GroupId = uuidv4();
	const roles = new Map<string, GroupRole>();
	roles.set(req.user.userId, 'owner');
	for (const m of parsed.data.members) roles.set(m, roles.get(m) || 'member');
	const group: Group = {
		groupId,
		name: parsed.data.name,
		ownerId: req.user.userId,
		memberIds: new Set([req.user.userId, ...parsed.data.members]),
		roles,
		createdAt: Date.now(),
		isSafetyRoom: true,
		ward: parsed.data.ward,
		verified: false
	};
	groupIdToGroup.set(groupId, group);
	const addMember = (uid: string) => {
		const set = userIdToGroups.get(uid) || new Set<GroupId>();
		set.add(groupId);
		userIdToGroups.set(uid, set);
	};
	addMember(req.user.userId);
	for (const m of parsed.data.members) addMember(m);
	return res.json({ groupId });
});

safetyRouter.get('/rooms', (_req: Request, res: Response) => {
	const rooms = [...groupIdToGroup.values()].filter((g) => g.isSafetyRoom);
	return res.json({
		rooms: rooms.map((g) => ({
			groupId: g.groupId,
			name: g.name,
			ward: g.ward,
			verified: !!g.verified,
			createdAt: g.createdAt,
			members: [...g.memberIds]
		}))
	});
});

// Join/leave safety room
safetyRouter.post('/rooms/:groupId/join', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group || !group.isSafetyRoom) return res.status(404).json({ error: 'not found' });
	group.memberIds.add(req.user.userId);
	const set = userIdToGroups.get(req.user.userId) || new Set<GroupId>();
	set.add(group.groupId);
	userIdToGroups.set(req.user.userId, set);
	return res.json({ ok: true, members: [...group.memberIds] });
});

safetyRouter.post('/rooms/:groupId/leave', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group || !group.isSafetyRoom) return res.status(404).json({ error: 'not found' });
	group.memberIds.delete(req.user.userId);
	const set = userIdToGroups.get(req.user.userId);
	if (set) {
		set.delete(group.groupId);
		userIdToGroups.set(req.user.userId, set);
	}
	return res.json({ ok: true, members: [...group.memberIds] });
});

// Mark safety room as verified (by web-admin)
const VerifyBody = z.object({ verified: z.boolean(), reason: z.string().optional() });
safetyRouter.post('/rooms/:groupId/verify', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = VerifyBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group || !group.isSafetyRoom) return res.status(404).json({ error: 'not found' });
	// Simple role gate: owner can verify for now; later, restrict to admin roles
	if (group.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	group.verified = parsed.data.verified;
	group.verifiedBy = req.user.userId;
	group.verifiedAt = Date.now();
	return res.json({ ok: true, verified: group.verified });
});

// Post a safety alert message into a room (logs into messageLog for now)
const AlertBody = z.object({
	content: z.string().min(1),
	contentType: z.string().optional()
});
safetyRouter.post('/rooms/:groupId/alerts', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = AlertBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group || !group.isSafetyRoom) return res.status(404).json({ error: 'not found' });
	if (!group.memberIds.has(req.user.userId)) return res.status(403).json({ error: 'not a member' });
	const id = uuidv4();
	const timestamp = Date.now();
	messageLog.push({ id, from: req.user.userId, to: group.groupId, scope: 'group', ciphertext: parsed.data.content, contentType: parsed.data.contentType, timestamp });
	return res.json({ ok: true, id, timestamp });
});

