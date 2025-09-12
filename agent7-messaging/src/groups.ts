import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Group, groupIdToGroup } from './state';
import { v4 as uuidv4 } from 'uuid';

export const groupsRouter = Router();

const CreateGroupBody = z.object({ name: z.string().optional(), members: z.array(z.string()).default([]), tags: z.array(z.string()).optional(), max: z.number().int().min(1).max(256).optional() });

groupsRouter.post('/', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CreateGroupBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const groupId = uuidv4();
	const roles = new Map<string, 'owner' | 'admin' | 'member'>();
	roles.set(req.user.userId, 'owner');
	const group: Group = {
		groupId,
		name: parsed.data.name,
		ownerId: req.user.userId,
		memberIds: new Set([req.user.userId, ...parsed.data.members]),
		roles,
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
	const actorRole = group.roles?.get(req.user.userId) || (group.ownerId === req.user.userId ? 'owner' : 'member');
	if (!(actorRole === 'owner' || actorRole === 'admin')) return res.status(403).json({ error: 'forbidden' });
	const parsed = AddMembersBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	for (const m of parsed.data.members) {
		if (group.memberIds.size >= 256) return res.status(400).json({ error: 'group member limit exceeded' });
		group.memberIds.add(m);
		group.roles?.set(m, 'member');
	}
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.delete('/:groupId/members/:userId', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	const actorRole = group.roles?.get(req.user.userId) || (group.ownerId === req.user.userId ? 'owner' : 'member');
	if (!(actorRole === 'owner' || actorRole === 'admin')) return res.status(403).json({ error: 'forbidden' });
	group.memberIds.delete(req.params.userId);
	group.roles?.delete(req.params.userId);
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.get('/:groupId', (req: Request, res: Response) => {
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	res.json({ groupId: group.groupId, name: group.name, ownerId: group.ownerId, members: [...group.memberIds], roles: Object.fromEntries(group.roles || []), createdAt: group.createdAt });
});

// Change member role
const ChangeRoleBody = z.object({ user_id: z.string().min(1), role: z.enum(['owner','admin','member']) });

groupsRouter.patch('/:groupId/roles', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	const parsed = ChangeRoleBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const actorRole = group.roles?.get(req.user.userId) || (group.ownerId === req.user.userId ? 'owner' : 'member');
	if (!(actorRole === 'owner')) return res.status(403).json({ error: 'forbidden' });
	const target = parsed.data.user_id;
	if (!group.memberIds.has(target)) return res.status(404).json({ error: 'member_not_found' });
	group.roles = group.roles || new Map();
	if (parsed.data.role === 'owner') {
		group.ownerId = target;
	}
	group.roles.set(target, parsed.data.role);
	return res.json({ ok: true, roles: Object.fromEntries(group.roles) });
});