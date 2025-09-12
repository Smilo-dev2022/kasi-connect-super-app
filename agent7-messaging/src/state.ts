import { WebSocket } from 'ws';

export type UserId = string;
export type GroupId = string;

export type GroupRole = 'owner' | 'admin' | 'member';
export const MAX_GROUP_MEMBERS = 256;

export type IdentityRecord = {
	userId: UserId;
	identityKey: string; // base64 or hex public key
	signedPreKey?: string; // optional signed pre-key
	updatedAt: number;
};

export type OneTimePreKey = { keyId: string; publicKey: string };

export type PreKeyBundle = {
	userId: UserId;
	oneTimePreKeys: OneTimePreKey[];
};

export type Group = {
	groupId: GroupId;
	name?: string;
	ownerId: UserId;
	memberIds: Set<UserId>;
	roles: Map<UserId, GroupRole>;
	createdAt: number;
};

export type CipherMessage = {
	id: string;
	from: UserId;
	to: UserId | GroupId;
	scope: 'direct' | 'group';
	ciphertext: string;
	contentType?: string;
	timestamp: number;
};

export const userIdToSocket = new Map<UserId, WebSocket>();
export const userIdToIdentity = new Map<UserId, IdentityRecord>();
export const userIdToPrekeys = new Map<UserId, OneTimePreKey[]>();
export const groupIdToGroup = new Map<GroupId, Group>();
export const messageLog: CipherMessage[] = [];

// Index of user membership for fast lookups
export const userIdToGroupIds = new Map<UserId, Set<GroupId>>();

export function addUserToGroup(group: Group, userId: UserId, role: GroupRole = 'member'): boolean {
	if (group.memberIds.has(userId)) return false;
	if (group.memberIds.size >= MAX_GROUP_MEMBERS) return false;
	group.memberIds.add(userId);
	group.roles.set(userId, role);
	const set = userIdToGroupIds.get(userId) || new Set<GroupId>();
	set.add(group.groupId);
	userIdToGroupIds.set(userId, set);
	return true;
}

export function removeUserFromGroup(group: Group, userId: UserId): void {
	group.memberIds.delete(userId);
	group.roles.delete(userId);
	const set = userIdToGroupIds.get(userId);
	if (set) {
		set.delete(group.groupId);
		if (set.size === 0) userIdToGroupIds.delete(userId);
	}
}

export function listGroupsForUser(userId: UserId): Group[] {
	const ids = userIdToGroupIds.get(userId);
	if (!ids) return [];
	const result: Group[] = [];
	for (const gid of ids) {
		const g = groupIdToGroup.get(gid);
		if (g) result.push(g);
	}
	return result;
}

export function deleteGroup(groupId: GroupId): void {
	const group = groupIdToGroup.get(groupId);
	if (!group) return;
	for (const uid of group.memberIds) {
		const set = userIdToGroupIds.get(uid);
		if (set) {
			set.delete(groupId);
			if (set.size === 0) userIdToGroupIds.delete(uid);
		}
	}
	groupIdToGroup.delete(groupId);
}