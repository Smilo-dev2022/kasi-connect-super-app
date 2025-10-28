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

// Incident Management
export type IncidentId = string;
export type IncidentStatus = 'open' | 'escalated' | 'resolved' | 'closed';

export type Incident = {
	id: IncidentId;
	roomId: GroupId;
	reporterId: UserId;
	type: string;
	description: string;
	status: IncidentStatus;
	location?: { lat: number; lon: number };
	createdAt: number;
	escalatedAt?: number;
	resolvedAt?: number;
};

export type IncidentAction = {
	id: string;
	incidentId: IncidentId;
	actorId: UserId;
	action: 'note' | 'assign' | 'escalate' | 'close';
	notes?: string;
	createdAt: number;
};

export type Evidence = {
	id: string;
	incidentId: IncidentId;
	uploaderId: UserId;
	mediaId: string;
	caption?: string;
	createdAt: number;
};

export const incidentIdToIncident = new Map<IncidentId, Incident>();
export const incidentIdToActions = new Map<IncidentId, IncidentAction[]>();
export const incidentIdToEvidence = new Map<IncidentId, Evidence[]>();