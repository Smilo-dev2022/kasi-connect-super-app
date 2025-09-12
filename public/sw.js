self.addEventListener('install', (event) => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	clients.claim();
});

self.addEventListener('push', (event) => {
	let data = {};
	try { data = event.data ? event.data.json() : {}; } catch {}
	const title = data.title || 'KasiLink';
	const body = data.body || (data.scope === 'group' ? 'New group message' : 'New message');
	const options = {
		body,
		data,
		tag: data.id || undefined,
		renotify: false,
		icon: '/favicon.ico',
		badge: '/favicon.ico',
	};
	event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = '/app/chats';
	event.waitUntil(
		clients.matchAll({ type: 'window' }).then((clientList) => {
			for (const client of clientList) {
				if ('focus' in client) return client.focus();
			}
			if (clients.openWindow) return clients.openWindow(url);
		})
	);
});

