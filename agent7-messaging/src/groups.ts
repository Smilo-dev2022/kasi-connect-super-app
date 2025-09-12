import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Group, groupIdToGroup, Role } from './state';
import { v4 as uuidv4 } from 'uuid';

export const groupsRouter = Router();

const CreateGroupBody = z.object({ name: z.string().optional(), members: z.array(z.string()).default([]), tags: z.array(z.string()).optional() });

groupsRouter.post('/', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CreateGroupBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const groupId = uuidv4();
	const group: Group = {
		groupId,
		name: parsed.data.name,
		ownerId: req.user.userId,
		memberIds: new Set([req.user.userId, ...parsed.data.members]),
		roles: new Map<string, Role>([[req.user.userId, 'owner']]),
		createdAt: Date.now(),
		tags: parsed.data.tags,
	};
	groupIdToGroup.set(groupId, group);
	res.json({ groupId });
});

const AddMembersBody = z.object({ members: z.array(z.string().min(1)).min(1) });

groupsRouter.post('/:groupId/members', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	if (group.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	const parsed = AddMembersBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	for (const m of parsed.data.members) {
		group.memberIds.add(m);
		group.roles?.set(m, 'member');
	}
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.delete('/:groupId/members/:userId', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	if (group.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	group.memberIds.delete(req.params.userId);
	group.roles?.delete(req.params.userId);
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.get('/:groupId', (req: Request, res: Response) => {
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	res.json({ groupId: group.groupId, name: group.name, ownerId: group.ownerId, members: [...group.memberIds], createdAt: group.createdAt });
});

// Change role of a member
const RoleBody = z.object({ userId: z.string().min(1), role: z.enum(['owner','admin','member']) });

groupsRouter.patch('/:groupId/roles', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = RoleBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	// Only owner can change roles for now
	if (group.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	if (!group.memberIds.has(parsed.data.userId)) return res.status(400).json({ error: 'not_a_member' });
	if (!group.roles) group.roles = new Map();
	group.roles.set(parsed.data.userId, parsed.data.role);
	return res.json({ ok: true, userId: parsed.data.userId, role: parsed.data.role });
});