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
	adminIds?: Set<UserId>;
	createdAt: number;
	// Safety room metadata (optional)
	isSafetyRoom?: boolean;
	ward?: string;
	verified?: boolean;
	verifiedBy?: UserId;
	verifiedAt?: number;
	tags?: string[];
};

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
	// delivery receipts
	deliveredTo?: UserId[];
	readBy?: UserId[];
};

export const userIdToSocket = new Map<UserId, WebSocket>();
export const userIdToIdentity = new Map<UserId, IdentityRecord>();
export const userIdToPrekeys = new Map<UserId, OneTimePreKey[]>();
export const groupIdToGroup = new Map<GroupId, Group>();
export const messageLog: CipherMessage[] = [];

export type MessageEvent =
	| { type: 'reaction'; id: string; messageId: string; userId: UserId; emoji: string; timestamp: number }
	| { type: 'edit'; id: string; messageId: string; userId: UserId; ciphertext: string; contentType?: string; timestamp: number }
	| { type: 'delete'; id: string; messageId: string; userId: UserId; timestamp: number }
	| { type: 'receipt'; id: string; messageId: string; userId: UserId; status: 'delivered' | 'read'; timestamp: number };

export const eventLog: MessageEvent[] = [];

export type Presence = { online: boolean; lastSeen: number };
export const userIdToPresence = new Map<UserId, Presence>();