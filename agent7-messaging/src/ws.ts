import { WebSocketServer, WebSocket, RawData } from 'ws';
import { IncomingMessage } from 'http';
import url from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { CipherMessage, Group, groupIdToGroup, messageLog, UserId, userIdToSocket, eventLog, deliveredByMessageId, readByMessageId, typingState, userPresence } from './state';

const jwtSecret = process.env.JWT_SECRET || 'devsecret';

type ClientInit = { type: 'hello'; userId: string };

type ClientMessage =
	| { type: 'ping' }
	| { type: 'msg'; id?: string; to: string; scope: 'direct' | 'group'; ciphertext: string; contentType?: string; timestamp?: number; replyTo?: string }
	| { type: 'react'; id?: string; messageId: string; emoji: string; timestamp?: number }
	| { type: 'edit'; id?: string; messageId: string; ciphertext: string; contentType?: string; timestamp?: number }
	| { type: 'delete'; id?: string; messageId: string; timestamp?: number }
	| { type: 'delivered'; messageId: string; timestamp?: number }
	| { type: 'read'; messageId: string; timestamp?: number }
	| { type: 'typing'; to: string; scope: 'direct' | 'group'; isTyping: boolean; timestamp?: number };

type ServerMessage =
	| { type: 'welcome'; userId: string }
	| { type: 'pong' }
	| { type: 'msg'; id: string; from: string; to: string; scope: 'direct' | 'group'; ciphertext: string; contentType?: string; timestamp: number; replyTo?: string; editedAt?: number; deletedAt?: number }
	| { type: 'reaction'; id: string; messageId: string; userId: string; emoji: string; timestamp: number }
	| { type: 'edit'; id: string; messageId: string; userId: string; ciphertext: string; contentType?: string; timestamp: number }
	| { type: 'delete'; id: string; messageId: string; userId: string; timestamp: number }
	| { type: 'delivered'; messageId: string; userId: string; timestamp: number }
	| { type: 'read'; messageId: string; userId: string; timestamp: number }
	| { type: 'typing'; to: string; scope: 'direct' | 'group'; userId: string; isTyping: boolean; timestamp: number }
	| { type: 'error'; id?: string; error: string };

export function attachWebSocketServer(server: import('http').Server) {
	const wss = new WebSocketServer({ server, path: '/ws' });

	// naive in-memory rate limiter per user
	const userLastTimestamps = new Map<UserId, number[]>();


	wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
		const parsedUrl = url.parse(request.url || '', true);
		const token = parsedUrl.query.token as string | undefined;
		const authHeader = request.headers['authorization'] || request.headers['Authorization'];
		const bearer = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
		const finalToken = bearer || token;
		if (!finalToken) {
			socket.close(1008, 'missing token');
			return;
		}
		let userId: UserId | undefined;
		try {
			const payload = jwt.verify(finalToken, jwtSecret) as { userId?: string };
			if (payload.userId) userId = payload.userId;
		} catch (e) {
			socket.close(1008, 'invalid token');
			return;
		}
		if (!userId) {
			socket.close(1008, 'invalid token payload');
			return;
		}

		userIdToSocket.set(userId, socket);
		userPresence.set(userId, { status: 'online', updatedAt: Date.now() });
		send(socket, { type: 'welcome', userId });

		socket.on('message', (data: RawData) => {
			try {
				const msg = JSON.parse(data.toString()) as ClientMessage;
				if (msg.type === 'ping') return send(socket, { type: 'pong' });

				// basic token bucket: max 30 ops per 10 seconds
				const now = Date.now();
				const bucket = userLastTimestamps.get(userId!) || [];
				const windowStart = now - 10_000;
				const recent = bucket.filter((t) => t >= windowStart);
				if (recent.length >= 30) {
					return send(socket, { type: 'error', error: 'rate_limited' });
				}
				recent.push(now);
				userLastTimestamps.set(userId!, recent);
				if (msg.type === 'msg') {
					const id = msg.id || uuidv4();
					const timestamp = msg.timestamp || Date.now();
					const from = userId!;
					const envelope: CipherMessage = {
						id,
						from,
						to: msg.to,
						scope: msg.scope,
						ciphertext: msg.ciphertext,
						contentType: msg.contentType,
						timestamp,
						replyTo: msg.replyTo,
					};
					messageLog.push(envelope);
					deliver(envelope);
					return;
				}
				if (msg.type === 'delivered') {
					const set = deliveredByMessageId.get(msg.messageId) || new Set<string>();
					set.add(userId!);
					deliveredByMessageId.set(msg.messageId, set);
					broadcastReceipt('delivered', msg.messageId, userId!);
					return;
				}
				if (msg.type === 'read') {
					const set = readByMessageId.get(msg.messageId) || new Set<string>();
					set.add(userId!);
					readByMessageId.set(msg.messageId, set);
					broadcastReceipt('read', msg.messageId, userId!);
					return;
				}
				if (msg.type === 'typing') {
					const timestamp = msg.timestamp || Date.now();
					const key = `${userId!}:${msg.scope}:${msg.to}`;
					typingState.set(key, { userId: userId!, to: msg.to, scope: msg.scope, isTyping: msg.isTyping, updatedAt: timestamp });
					broadcastTyping(userId!, msg.to, msg.scope, msg.isTyping, timestamp);
					return;
				}
				if (msg.type === 'react') {
					const id = msg.id || uuidv4();
					const timestamp = msg.timestamp || Date.now();
					const original = messageLog.find((m) => m.id === msg.messageId);
					if (!original) return send(socket, { type: 'error', error: 'message_not_found' });
					eventLog.push({ type: 'reaction', id, messageId: msg.messageId, userId: userId!, emoji: msg.emoji, timestamp });
					deliverEvent({ type: 'reaction', id, messageId: msg.messageId, userId: userId!, emoji: msg.emoji, timestamp }, original);
					return;
				}
				if (msg.type === 'edit') {
					const id = msg.id || uuidv4();
					const timestamp = msg.timestamp || Date.now();
					const original = messageLog.find((m) => m.id === msg.messageId);
					if (!original) return send(socket, { type: 'error', error: 'message_not_found' });
					if (original.from !== userId) return send(socket, { type: 'error', error: 'forbidden' });
					original.ciphertext = msg.ciphertext;
					original.contentType = msg.contentType;
					original.editedAt = timestamp;
					eventLog.push({ type: 'edit', id, messageId: msg.messageId, userId: userId!, ciphertext: msg.ciphertext, contentType: msg.contentType, timestamp });
					deliverEvent({ type: 'edit', id, messageId: msg.messageId, userId: userId!, ciphertext: msg.ciphertext, contentType: msg.contentType, timestamp }, original);
					return;
				}
				if (msg.type === 'delete') {
					const id = msg.id || uuidv4();
					const timestamp = msg.timestamp || Date.now();
					const original = messageLog.find((m) => m.id === msg.messageId);
					if (!original) return send(socket, { type: 'error', error: 'message_not_found' });
					if (original.from !== userId) return send(socket, { type: 'error', error: 'forbidden' });
					original.deletedAt = timestamp;
					eventLog.push({ type: 'delete', id, messageId: msg.messageId, userId: userId!, timestamp });
					deliverEvent({ type: 'delete', id, messageId: msg.messageId, userId: userId!, timestamp }, original);
					return;
				}
			} catch (e) {
				send(socket, { type: 'error', error: 'bad-message' });
			}
		});

		socket.on('close', () => {
			if (userId && userIdToSocket.get(userId) === socket) {
				userIdToSocket.delete(userId);
				userPresence.set(userId, { status: 'offline', updatedAt: Date.now() });
			}
		});
	});
}

function send(socket: WebSocket, message: ServerMessage) {
	try {
		socket.send(JSON.stringify(message));
	} catch {}
}

function deliver(envelope: CipherMessage) {
	if (envelope.scope === 'direct') {
		const recipient = userIdToSocket.get(envelope.to);
		if (recipient) send(recipient, { type: 'msg', ...envelope });
		const sender = userIdToSocket.get(envelope.from);
		if (sender) send(sender, { type: 'msg', ...envelope });
		return;
	}
	if (envelope.scope === 'group') {
		const group: Group | undefined = groupIdToGroup.get(String(envelope.to));
		if (!group) return;
		for (const memberId of group.memberIds) {
			const ws = userIdToSocket.get(memberId);
			if (ws) send(ws, { type: 'msg', ...envelope });
		}
	}
}

function deliverEvent(event: { type: 'reaction' | 'edit' | 'delete'; id: string; messageId: string; userId: string; emoji?: string; ciphertext?: string; contentType?: string; timestamp: number }, original: CipherMessage) {
    if (original.scope === 'direct') {
        const recipient = userIdToSocket.get(original.to);
        if (recipient) send(recipient, event as ServerMessage);
        const sender = userIdToSocket.get(original.from);
        if (sender) send(sender, event as ServerMessage);
        return;
    }
    if (original.scope === 'group') {
        const group: Group | undefined = groupIdToGroup.get(String(original.to));
        if (!group) return;
        for (const memberId of group.memberIds) {
            const ws = userIdToSocket.get(memberId);
            if (ws) send(ws, event as ServerMessage);
        }
    }
}

function broadcastReceipt(kind: 'delivered' | 'read', messageId: string, userId: string) {
	const original = messageLog.find((m) => m.id === messageId);
	if (!original) return;
	const payload: ServerMessage = { type: kind, messageId, userId, timestamp: Date.now() } as any;
	if (original.scope === 'direct') {
		const recipient = userIdToSocket.get(original.to);
		if (recipient) send(recipient, payload);
		const sender = userIdToSocket.get(original.from);
		if (sender) send(sender, payload);
		return;
	}
	if (original.scope === 'group') {
		const group: Group | undefined = groupIdToGroup.get(String(original.to));
		if (!group) return;
		for (const memberId of group.memberIds) {
			const ws = userIdToSocket.get(memberId);
			if (ws) send(ws, payload);
		}
	}
}

function broadcastTyping(userId: string, to: string, scope: 'direct' | 'group', isTyping: boolean, timestamp: number) {
	const payload: ServerMessage = { type: 'typing', to, scope, userId, isTyping, timestamp } as any;
	if (scope === 'direct') {
		const recipient = userIdToSocket.get(to);
		if (recipient) send(recipient, payload);
		return;
	}
	if (scope === 'group') {
		const group: Group | undefined = groupIdToGroup.get(String(to));
		if (!group) return;
		for (const memberId of group.memberIds) {
			if (memberId === userId) continue;
			const ws = userIdToSocket.get(memberId);
			if (ws) send(ws, payload);
		}
	}
}