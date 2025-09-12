import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TypesenseAdapter } from '../adapters/typesense';
import { OpenSearchAdapter } from '../adapters/opensearch';
import type { SearchAdapter } from '../adapters/search';
import type { MessageStub } from '../types/message';

export function registerRoutes(app: FastifyInstance, env: Record<string, string | undefined>) {
	let adapter: SearchAdapter;
	if ((env.SEARCH_DRIVER || 'typesense') === 'opensearch') adapter = new OpenSearchAdapter(env);
	else adapter = new TypesenseAdapter(env);

	app.addHook('onReady', async () => {
		await adapter.ensureSchema();
	});

	app.post('/index/messages', async (req, reply) => {
		const body = await req.body;
		const schema = z.object({ messages: z.array(z.any()) });
		const { messages } = schema.parse(body) as { messages: MessageStub[] };
		const res = await adapter.indexMessages(messages);
		return reply.send(res);
	});

	app.get('/search', async (req, reply) => {
		const query = z.object({ q: z.string(), limit: z.string().optional() }).parse(req.query as any);
		const res = await adapter.search({ q: query.q, limit: query.limit ? Number(query.limit) : undefined });
		return reply.send(res);
	});
}

