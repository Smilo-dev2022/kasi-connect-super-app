import http from 'http';
import { attachWebSocketServer } from './ws';
import { createApp } from './app';

const app = createApp();
const server = http.createServer(app);
attachWebSocketServer(server);

const PORT = Number(process.env.PORT || 8080);
server.listen(PORT, () => {
	// eslint-disable-next-line no-console
	console.log(`Agent7 messaging listening on http://localhost:${PORT}`);
});