import io, { Socket } from 'socket.io-client';
import { ENV } from '@api/../config/env';

export type TypingEvent = { threadId: string; userId: string; typing: boolean };

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
	if (socket && socket.connected) return socket;
	socket = io(ENV.socketUrl, {
		transports: ['websocket'],
		extraHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
	});
	return socket;
}

export function emitTyping(threadId: string, userId: string, typing: boolean) {
	if (!socket) return;
	socket.emit('typing', { threadId, userId, typing } as TypingEvent);
}

export function onTyping(callback: (evt: TypingEvent) => void) {
	socket?.on('typing', callback);
	return () => socket?.off('typing', callback);
}