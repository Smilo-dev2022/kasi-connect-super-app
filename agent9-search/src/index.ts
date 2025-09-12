import 'dotenv/config';
import Fastify from 'fastify';
import { z } from 'zod';
import { registerRoutes } from './routes';

const envSchema = z.object({
	PORT: z.string().default('8089'),
	SEARCH_DRIVER: z.enum(['opensearch', 'typesense']).default('typesense'),
	OPENSEARCH_URL: z.string().optional(),
	OPENSEARCH_USERNAME: z.string().optional(),
	OPENSEARCH_PASSWORD: z.string().optional(),
	TYPESENSE_HOST: z.string().optional(),
	TYPESENSE_PORT: z.string().optional(),
	TYPESENSE_PROTOCOL: z.enum(['http','https']).optional(),
	TYPESENSE_API_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

const app = Fastify({ logger: true });

registerRoutes(app, env);

app.listen({ port: Number(env.PORT), host: '0.0.0.0' })
	.then(() => app.log.info(`agent9-search listening on ${env.PORT}`))
	.catch((err) => { app.log.error(err); process.exit(1); });

