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
	roles?: Map<UserId, 'owner' | 'admin' | 'member'>;
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
};

export const userIdToSocket = new Map<UserId, WebSocket>();
export const userIdToIdentity = new Map<UserId, IdentityRecord>();
export const userIdToPrekeys = new Map<UserId, OneTimePreKey[]>();
export const groupIdToGroup = new Map<GroupId, Group>();
export const messageLog: CipherMessage[] = [];

export type MessageEvent =
	| { type: 'reaction'; id: string; messageId: string; userId: UserId; emoji: string; timestamp: number }
	| { type: 'edit'; id: string; messageId: string; userId: UserId; ciphertext: string; contentType?: string; timestamp: number }
	| { type: 'delete'; id: string; messageId: string; userId: UserId; timestamp: number };

export const eventLog: MessageEvent[] = [];

// Presence and typing state
export const userPresence = new Map<UserId, { status: 'online' | 'away' | 'offline'; updatedAt: number }>();
export const typingState = new Map<string, { userId: UserId; to: UserId | GroupId; scope: 'direct' | 'group'; isTyping: boolean; updatedAt: number }>();

// Delivery and read receipts
export const deliveredByMessageId = new Map<string, Set<UserId>>();
export const readByMessageId = new Map<string, Set<UserId>>();

// Devices registry (push)
export type DeviceRecord = { id: string; userId: UserId; platform: 'ios' | 'android' | 'web'; token: string; lastSeenAt?: number; createdAt: number };
export const deviceIdToDevice = new Map<string, DeviceRecord>();
export const userIdToDevices = new Map<UserId, Set<string>>();

// Media registry (very simple local store)
export type MediaRecordMeta = {
	id: string;
	kind: 'image' | 'video' | 'audio' | 'file';
	mime?: string;
	size?: number;
	originalPath?: string;
	thumbPath?: string;
	status: 'pending' | 'ready' | 'failed';
	createdAt: number;
};
export const mediaIdToMeta = new Map<string, MediaRecordMeta>();