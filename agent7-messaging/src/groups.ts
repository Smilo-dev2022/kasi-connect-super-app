import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { Group, GroupRole, MAX_GROUP_MEMBERS, addUserToGroup, deleteGroup, groupIdToGroup, listGroupsForUser, removeUserFromGroup } from './state';
import { v4 as uuidv4 } from 'uuid';

export const groupsRouter = Router();

const CreateGroupBody = z.object({ name: z.string().optional(), members: z.array(z.string()).default([]) });

groupsRouter.post('/', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CreateGroupBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

	const uniqueMembers = Array.from(new Set([req.user.userId, ...parsed.data.members]));
	if (uniqueMembers.length > MAX_GROUP_MEMBERS)
		return res.status(400).json({ error: 'group_too_large', max: MAX_GROUP_MEMBERS });

	const groupId = uuidv4();
	const roles = new Map<string, GroupRole>();
	const memberIds = new Set<string>();
	const group: Group = {
		groupId,
		name: parsed.data.name,
		ownerId: req.user.userId,
		memberIds,
		roles,
		createdAt: Date.now(),
	};

	addUserToGroup(group, req.user.userId, 'owner');
	for (const m of uniqueMembers) {
		if (m === req.user.userId) continue;
		addUserToGroup(group, m, 'member');
	}

	groupIdToGroup.set(groupId, group);
	res.json({ groupId });
});

groupsRouter.get('/mine', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const groups = listGroupsForUser(req.user.userId).map((g) => ({
		groupId: g.groupId,
		name: g.name,
		ownerId: g.ownerId,
		membersCount: g.memberIds.size,
		role: g.roles.get(req.user!.userId) || 'member',
		createdAt: g.createdAt,
	}));
	res.json({ groups });
});

const AddMembersBody = z.object({ members: z.array(z.string().min(1)).min(1) });

groupsRouter.post('/:groupId/members', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	const role = group.roles.get(req.user.userId);
	if (!role || (role !== 'owner' && role !== 'admin')) return res.status(403).json({ error: 'forbidden' });
	const parsed = AddMembersBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const newCandidates = Array.from(new Set(parsed.data.members.filter((m) => !group.memberIds.has(m))));
	if (group.memberIds.size + newCandidates.length > MAX_GROUP_MEMBERS)
		return res.status(400).json({ error: 'group_full', max: MAX_GROUP_MEMBERS });
	for (const m of newCandidates) addUserToGroup(group, m, 'member');
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.delete('/:groupId/members/:userId', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	const actorRole = group.roles.get(req.user.userId);
	if (!actorRole) return res.status(403).json({ error: 'forbidden' });
	const targetId = req.params.userId;
	const targetRole = group.roles.get(targetId);
	if (!group.memberIds.has(targetId)) return res.status(404).json({ error: 'member_not_found' });
	if (targetId === group.ownerId) return res.status(400).json({ error: 'cannot_remove_owner' });
	if (actorRole === 'admin' && targetRole && targetRole !== 'member') return res.status(403).json({ error: 'admin_cannot_remove_admin' });
	if (req.user.userId === targetId && actorRole !== 'owner') return res.status(400).json({ error: 'use_leave_to_self_remove' });
	removeUserFromGroup(group, targetId);
	res.json({ ok: true, members: [...group.memberIds] });
});

groupsRouter.get('/:groupId', (req: Request, res: Response) => {
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	const roles: Record<string, GroupRole> = {};
	for (const [uid, role] of group.roles.entries()) roles[uid] = role;
	res.json({
		groupId: group.groupId,
		name: group.name,
		ownerId: group.ownerId,
		members: [...group.memberIds],
		membersCount: group.memberIds.size,
		maxMembers: MAX_GROUP_MEMBERS,
		roles,
		createdAt: group.createdAt,
	});
});

groupsRouter.post('/:groupId/join', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	if (group.memberIds.has(req.user.userId)) return res.json({ ok: true, already: true });
	if (group.memberIds.size >= MAX_GROUP_MEMBERS) return res.status(400).json({ error: 'group_full' });
	addUserToGroup(group, req.user.userId, 'member');
	res.json({ ok: true, membersCount: group.memberIds.size });
});

groupsRouter.post('/:groupId/leave', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	if (!group.memberIds.has(req.user.userId)) return res.status(400).json({ error: 'not_a_member' });
	if (group.ownerId === req.user.userId) {
		if (group.memberIds.size > 1) return res.status(400).json({ error: 'owner_must_transfer' });
		deleteGroup(group.groupId);
		return res.json({ ok: true, deleted: true });
	}
	removeUserFromGroup(group, req.user.userId);
	res.json({ ok: true, left: true });
});

const UpdateRoleBody = z.object({ userId: z.string().min(1), role: z.enum(['admin', 'member']) });
groupsRouter.post('/:groupId/roles', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	if (group.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	const parsed = UpdateRoleBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const { userId, role } = parsed.data;
	if (!group.memberIds.has(userId)) return res.status(404).json({ error: 'member_not_found' });
	if (userId === group.ownerId) return res.status(400).json({ error: 'cannot_change_owner_role' });
	group.roles.set(userId, role as GroupRole);
	res.json({ ok: true, userId, role });
});

const TransferBody = z.object({ newOwnerId: z.string().min(1) });
groupsRouter.post('/:groupId/transfer', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	if (group.ownerId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	const parsed = TransferBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const { newOwnerId } = parsed.data;
	if (!group.memberIds.has(newOwnerId)) return res.status(404).json({ error: 'member_not_found' });
	group.roles.set(group.ownerId, 'admin');
	group.ownerId = newOwnerId;
	group.roles.set(newOwnerId, 'owner');
	res.json({ ok: true, ownerId: group.ownerId });
});

groupsRouter.get('/:groupId/members', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const group = groupIdToGroup.get(req.params.groupId);
	if (!group) return res.status(404).json({ error: 'not_found' });
	const members = [...group.memberIds].map((uid) => ({ userId: uid, role: (group.roles.get(uid) as GroupRole) || 'member' }));
	res.json({ members, count: group.memberIds.size, max: MAX_GROUP_MEMBERS });
});