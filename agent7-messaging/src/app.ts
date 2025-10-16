import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { authRouter, requireJwt } from './auth';
import { requireAllowlist, isFeatureEnabled } from './gates';
import { keysRouter } from './keys';
import { groupsRouter } from './groups';
import { getMissedMessagesRouter } from './messages_http';
import { safetyRouter } from './safety';

dotenv.config();

export function createApp() {
	const app = express();
	app.use(cors());
	app.use(helmet());
	app.use(express.json({ limit: '1mb' }));
	app.use(morgan('dev'));

	app.get('/health', (_req, res) => {
		res.json({ ok: true, service: 'agent7-messaging' });
	});

	// Minimal OpenAPI endpoint
	const openapiDoc = {
		openapi: '3.0.3',
		info: { title: 'Agent7 Messaging API', version: '0.1.0' },
		paths: {
			'/health': { get: { responses: { '200': { description: 'ok' } } } },
			'/auth/dev-token': { post: { responses: { '200': { description: 'token' } } } },
			'/keys/identity': { post: { responses: { '200': { description: 'ok' } } } },
			'/keys/prekeys': { post: { responses: { '200': { description: 'ok' } } } },
			'/keys/prekeys/{userId}': { get: { responses: { '200': { description: 'ok' }, '404': { description: 'not found' } } } },
			'/groups': { post: { responses: { '200': { description: 'ok' } } } },
			'/messages/since/{timestamp}': { get: { responses: { '200': { description: 'ok' } } } },
			'/safety/rooms': { get: { responses: { '200': { description: 'ok' } } }, post: { responses: { '200': { description: 'ok' } } } },
		},
	} as const;

	app.get('/openapi.json', (_req, res) => {
		res.json(openapiDoc);
	});

	app.use('/auth', authRouter);
	// Dark launch gates for core surfaces when flag is enabled
	const darkLaunch = isFeatureEnabled('dark_launch');
	const base = [requireJwt] as const;
	const gated = darkLaunch ? ([requireJwt, requireAllowlist] as const) : base;
	app.use('/keys', ...gated, keysRouter);
	app.use('/groups', ...gated, groupsRouter);
	app.use('/messages', ...gated, getMissedMessagesRouter);
	app.use('/safety', ...gated, safetyRouter);

	if (process.env.NODE_ENV === 'production') {
		app.enable('trust proxy');
		app.use((req, res, next) => {
			const proto = req.header('x-forwarded-proto');
			if (proto && proto !== 'https') {
				const host = req.header('x-forwarded-host') || req.header('host');
				return res.redirect(301, `https://${host}${req.originalUrl}`);
			}
			return next();
		});
	}

	return app;
}

