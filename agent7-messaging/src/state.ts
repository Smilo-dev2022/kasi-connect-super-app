import { WebSocket } from 'ws';

export type UserId = string;
export type GroupId = string;

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
	// Safety room metadata (optional)
	isSafetyRoom?: boolean;
	ward?: string;
	verified?: boolean;
	verifiedBy?: UserId;
	verifiedAt?: number;
	tags?: string[];
};

export type GroupRole = 'owner' | 'admin' | 'member';

export type CipherMessage = {
	id: string;
	from: UserId;
	to: UserId | GroupId;
	scope: 'direct' | 'group';
	ciphertext: string;
	contentType?: string;
	timestamp: number;
	replyTo?: string;
	editedAt?: number;
	deletedAt?: number;
};

export const userIdToSocket = new Map<UserId, WebSocket>();
export const userIdToIdentity = new Map<UserId, IdentityRecord>();
export const userIdToPrekeys = new Map<UserId, OneTimePreKey[]>();
export const groupIdToGroup = new Map<GroupId, Group>();
// In-memory default storage (dev). Optionally, persist to Redis when configured.
export const messageLog: CipherMessage[] = [];

// Presence/maps to speed up fanout
export const onlineUsers = new Set<UserId>();
export const userIdToGroups = new Map<UserId, Set<GroupId>>();

export type MessageEvent =
	| { type: 'reaction'; id: string; messageId: string; userId: UserId; emoji: string; timestamp: number }
	| { type: 'edit'; id: string; messageId: string; userId: UserId; ciphertext: string; contentType?: string; timestamp: number }
	| { type: 'delete'; id: string; messageId: string; userId: UserId; timestamp: number }
	| { type: 'receipt'; id: string; messageId: string; userId: UserId; receipt: 'delivered' | 'read'; timestamp: number };

export const eventLog: MessageEvent[] = [];

// Optional Redis persistence hooks (no-op when REDIS_URL is unset)
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
export const redis = redisUrl ? new Redis(redisUrl) : undefined;

export async function persistMessage(envelope: CipherMessage): Promise<void> {
  if (!redis) return;
  try {
    await redis.xadd('msgs', '*', 'id', envelope.id, 'from', envelope.from, 'to', String(envelope.to), 'scope', envelope.scope, 'ts', String(envelope.timestamp), 'ct', envelope.ciphertext, 'cty', envelope.contentType || '');
  } catch {}
}

export async function persistEvent(event: MessageEvent): Promise<void> {
  if (!redis) return;
  try {
    await redis.xadd('events', '*', 'type', event.type, 'mid', event.messageId, 'uid', event.userId, 'ts', String(event.timestamp), 'extra', JSON.stringify(event));
  } catch {}
}