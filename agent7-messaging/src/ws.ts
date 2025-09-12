import { WebSocketServer, WebSocket, RawData } from 'ws';
import { IncomingMessage } from 'http';
import url from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { CipherMessage, Group, groupIdToGroup, messageLog, UserId, userIdToSocket, eventLog, userIdToPresence } from './state';

const jwtSecret = process.env.JWT_SECRET || 'devsecret';

type ClientInit = { type: 'hello'; userId: string };

type ClientMessage =
	| { type: 'ping' }
	| { type: 'msg'; id?: string; to: string; scope: 'direct' | 'group'; ciphertext: string; contentType?: string; timestamp?: number; replyTo?: string }
	| { type: 'react'; id?: string; messageId: string; emoji: string; timestamp?: number }
	| { type: 'edit'; id?: string; messageId: string; ciphertext: string; contentType?: string; timestamp?: number }
	| { type: 'delete'; id?: string; messageId: string; timestamp?: number }
	| { type: 'receipt'; id?: string; messageId: string; status: 'delivered' | 'read'; timestamp?: number }
	| { type: 'typing'; to: string; scope: 'direct' | 'group'; typing: boolean; timestamp?: number };

type ServerMessage =
	| { type: 'welcome'; userId: string }
	| { type: 'pong' }
	| { type: 'msg'; id: string; from: string; to: string; scope: 'direct' | 'group'; ciphertext: string; contentType?: string; timestamp: number; replyTo?: string; editedAt?: number; deletedAt?: number }
	| { type: 'reaction'; id: string; messageId: string; userId: string; emoji: string; timestamp: number }
	| { type: 'edit'; id: string; messageId: string; userId: string; ciphertext: string; contentType?: string; timestamp: number }
	| { type: 'delete'; id: string; messageId: string; userId: string; timestamp: number }
	| { type: 'receipt'; id: string; messageId: string; userId: string; status: 'delivered' | 'read'; timestamp: number }
	| { type: 'presence'; userId: string; online: boolean; lastSeen: number }
	| { type: 'typing'; from: string; to: string; scope: 'direct' | 'group'; typing: boolean; timestamp: number }
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
		userIdToPresence.set(userId, { online: true, lastSeen: Date.now() });
		send(socket, { type: 'welcome', userId });
		broadcastPresence(userId, true);

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
					if (msg.scope === 'group') {
						const group = groupIdToGroup.get(String(msg.to));
						if (!group || !group.memberIds.has(from)) return send(socket, { type: 'error', error: 'not_group_member' });
					}
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
				if (msg.type === 'receipt') {
					const id = msg.id || uuidv4();
					const timestamp = msg.timestamp || Date.now();
					const original = messageLog.find((m) => m.id === msg.messageId);
					if (!original) return send(socket, { type: 'error', error: 'message_not_found' });
					recordAndBroadcastReceipt(msg.status, userId!, original, id, timestamp);
					return;
				}
				if (msg.type === 'typing') {
					const nowTs = msg.timestamp || Date.now();
					broadcastTyping({ from: userId!, to: msg.to, scope: msg.scope, typing: msg.typing, timestamp: nowTs });
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
				userIdToPresence.set(userId, { online: false, lastSeen: Date.now() });
				broadcastPresence(userId, false);
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
		if (recipient) {
			send(recipient, { type: 'msg', ...envelope });
			// delivered receipt
			recordAndBroadcastReceipt('delivered', envelope.to as string, envelope);
		}
		const sender = userIdToSocket.get(envelope.from);
		if (sender) send(sender, { type: 'msg', ...envelope });
		return;
	}
	if (envelope.scope === 'group') {
		const group: Group | undefined = groupIdToGroup.get(String(envelope.to));
		if (!group) return;
		for (const memberId of group.memberIds) {
			const ws = userIdToSocket.get(memberId);
			if (ws) {
				send(ws, { type: 'msg', ...envelope });
				if (memberId !== envelope.from) {
					recordAndBroadcastReceipt('delivered', memberId, envelope);
				}
			}
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

function recordAndBroadcastReceipt(status: 'delivered' | 'read', ackUserId: string, original: CipherMessage, id?: string, timestamp?: number) {
    const ts = timestamp || Date.now();
    const recId = id || uuidv4();
    if (status === 'delivered') {
        original.deliveredTo = Array.from(new Set([...(original.deliveredTo || []), ackUserId]));
    } else if (status === 'read') {
        original.readBy = Array.from(new Set([...(original.readBy || []), ackUserId]));
    }
    eventLog.push({ type: 'receipt', id: recId, messageId: original.id, userId: ackUserId, status, timestamp: ts });
    // broadcast to relevant participants
    if (original.scope === 'direct') {
        const recipient = userIdToSocket.get(original.to);
        if (recipient) send(recipient, { type: 'receipt', id: recId, messageId: original.id, userId: ackUserId, status, timestamp: ts });
        const sender = userIdToSocket.get(original.from);
        if (sender) send(sender, { type: 'receipt', id: recId, messageId: original.id, userId: ackUserId, status, timestamp: ts });
        return;
    }
    if (original.scope === 'group') {
        const group: Group | undefined = groupIdToGroup.get(String(original.to));
        if (!group) return;
        for (const memberId of group.memberIds) {
            const ws = userIdToSocket.get(memberId);
            if (ws) send(ws, { type: 'receipt', id: recId, messageId: original.id, userId: ackUserId, status, timestamp: ts });
        }
    }
}

function broadcastPresence(userId: string, online: boolean) {
    const presence = userIdToPresence.get(userId);
    const lastSeen = presence?.lastSeen || Date.now();
    for (const [, ws] of userIdToSocket) {
        try { ws.send(JSON.stringify({ type: 'presence', userId, online, lastSeen } as ServerMessage)); } catch {}
    }
}

function broadcastTyping(evt: { from: string; to: string; scope: 'direct' | 'group'; typing: boolean; timestamp: number }) {
    if (evt.scope === 'direct') {
        const wsTo = userIdToSocket.get(evt.to);
        if (wsTo) send(wsTo, { type: 'typing', ...evt });
        const wsFrom = userIdToSocket.get(evt.from);
        if (wsFrom) send(wsFrom, { type: 'typing', ...evt });
        return;
    }
    const group = groupIdToGroup.get(String(evt.to));
    if (!group) return;
    for (const memberId of group.memberIds) {
        const sock = userIdToSocket.get(memberId);
        if (sock) send(sock, { type: 'typing', ...evt });
    }
}