import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Group, GroupId, GroupRole, groupIdToGroup, userIdToGroups } from './state';
import { v4 as uuidv4 } from 'uuid';

export const groupsRouter = Router();

const CreateGroupBody = z.object({ name: z.string().optional(), members: z.array(z.string()).default([]), tags: z.array(z.string()).optional() });

groupsRouter.post('/', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CreateGroupBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const groupId = uuidv4();
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
		tags: parsed.data.tags,
	};
	groupIdToGroup.set(groupId, group);
	// reverse index
	const addMember = (uid: string) => {
		const set = userIdToGroups.get(uid) || new Set<GroupId>();
		set.add(groupId);
		userIdToGroups.set(uid, set);
	};
	addMember(req.user.userId);
	for (const m of parsed.data.members) addMember(m);
	res.json({ groupId });
});

const AddMembersBody = z.object({ members: z.array(z.string().min(1)).min(1) });

groupsRouter.post('/:groupId/members', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	const role = group.roles.get(req.user.userId);
	if (role !== 'owner' && role !== 'admin') return res.status(403).json({ error: 'forbidden' });
	const parsed = AddMembersBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	for (const m of parsed.data.members) {
		group.memberIds.add(m);
		if (!group.roles.has(m)) group.roles.set(m, 'member');
		const set = userIdToGroups.get(m) || new Set<GroupId>();
		set.add(group.groupId);
		userIdToGroups.set(m, set);
	}
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.delete('/:groupId/members/:userId', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	const actorRole = group.roles.get(req.user.userId);
	const targetId = req.params.userId;
	const targetRole = group.roles.get(targetId);
	if (actorRole !== 'owner' && actorRole !== 'admin') return res.status(403).json({ error: 'forbidden' });
	if (targetId === group.ownerId) return res.status(400).json({ error: 'cannot_remove_owner' });
	if (actorRole === 'admin' && targetRole === 'admin') return res.status(403).json({ error: 'forbidden' });
	group.memberIds.delete(targetId);
	group.roles.delete(targetId);
	const set = userIdToGroups.get(targetId);
	if (set) {
		set.delete(group.groupId);
		if (set.size === 0) {
			userIdToGroups.delete(targetId);
		}
	}
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.get('/:groupId', (req: Request, res: Response) => {
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	const admins = [...group.roles.entries()].filter(([, r]) => r === 'admin').map(([u]) => u);
	res.json({ groupId: group.groupId, name: group.name, ownerId: group.ownerId, members: [...group.memberIds], admins, createdAt: group.createdAt });
});

// Owner can promote/demote admins
const RoleBody = z.object({ userId: z.string().min(1), role: z.enum(['admin', 'member']) });
groupsRouter.post('/:groupId/roles', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not found' });
	if (group.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	const parsed = RoleBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const { userId, role } = parsed.data;
	if (userId === group.ownerId) return res.status(400).json({ error: 'cannot_change_owner_role' });
	if (!group.memberIds.has(userId)) return res.status(404).json({ error: 'user_not_member' });
	group.roles.set(userId, role);
	return res.json({ ok: true, admins: [...group.roles.entries()].filter(([, r]) => r === 'admin').map(([u]) => u) });
});