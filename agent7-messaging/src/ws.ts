import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import url from 'url';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { CipherMessage, Group, groupIdToGroup, messageLog, UserId, userIdToSocket } from './state';

const jwtSecret = process.env.JWT_SECRET || 'devsecret';

type ClientInit = { type: 'hello'; userId: string };

type ClientMessage =
	| { type: 'ping' }
	| { type: 'msg'; id?: string; to: string; scope: 'direct' | 'group'; ciphertext: string; contentType?: string; timestamp?: number };

type ServerMessage =
	| { type: 'welcome'; userId: string }
	| { type: 'pong' }
	| { type: 'msg'; id: string; from: string; to: string; scope: 'direct' | 'group'; ciphertext: string; contentType?: string; timestamp: number }
	| { type: 'error'; id?: string; error: string };

export function attachWebSocketServer(server: import('http').Server) {
	const wss = new WebSocketServer({ server, path: '/ws' });

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
		send(socket, { type: 'welcome', userId });

		socket.on('message', (data) => {
			try {
				const msg = JSON.parse(data.toString()) as ClientMessage;
				if (msg.type === 'ping') return send(socket, { type: 'pong' });
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
					};
					messageLog.push(envelope);
					deliver(envelope);
					return;
				}
			} catch (e) {
				send(socket, { type: 'error', error: 'bad-message' });
			}
		});

		socket.on('close', () => {
			if (userId && userIdToSocket.get(userId) === socket) {
				userIdToSocket.delete(userId);
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