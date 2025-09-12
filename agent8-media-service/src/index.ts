import Fastify from 'fastify';
import cors from '@fastify/cors';
import underPressure from '@fastify/under-pressure';
import { config } from './lib/config.js';
import { registerUploadRoutes } from './routes/uploads.js';
import { registerFileRoutes } from './routes/files.js';

async function buildServer() {
	const app = Fastify({
		logger: true,
	});

	await app.register(cors, { origin: true });
	await app.register(underPressure);

	app.get('/health', async () => ({ status: 'ok' }));

	await registerUploadRoutes(app);
	await registerFileRoutes(app);

	return app;
}

async function start() {
	const app = await buildServer();
	try {
		await app.listen({ port: config.app.port, host: config.app.host });
		app.log.info(`Media service listening on ${config.app.host}:${config.app.port}`);
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}

start();

