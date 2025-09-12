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
	createdAt: number;
	// Safety room extensions
	isSafetyRoom?: boolean;
	ward?: string;
	verifiedCPF?: boolean;
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

export type MessageEvent = {
	id: string;
	eventType: 'reaction' | 'edit' | 'delete' | 'reply';
	from: UserId;
	to: UserId | GroupId;
	scope: 'direct' | 'group';
	messageId: string; // target/origin message id
	ciphertext?: string; // optional encrypted payload for edits/replies
	reaction?: string; // for reactions (e.g., ":thumbs_up:")
	timestamp: number;
};

export const userIdToSocket = new Map<UserId, WebSocket>();
export const userIdToIdentity = new Map<UserId, IdentityRecord>();
export const userIdToPrekeys = new Map<UserId, OneTimePreKey[]>();
export const groupIdToGroup = new Map<GroupId, Group>();
export const messageLog: CipherMessage[] = [];
export const eventLog: MessageEvent[] = [];

// Key transparency: append-only history of identity key updates
export const keyTransparencyLog = new Map<UserId, IdentityRecord[]>();

// Ward verification: which user is verified for which ward (admin-side)
export const userIdToVerifiedWard = new Map<UserId, string>();

// Simple in-memory token bucket state for rate limiting
export const rateLimitState = new Map<string, { tokens: number; lastRefill: number }>();