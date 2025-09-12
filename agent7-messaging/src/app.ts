import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { authRouter, requireJwt } from './auth';
import { keysRouter } from './keys';
import { groupsRouter } from './groups';
import { getMissedMessagesRouter } from './messages_http';
import { safetyRouter } from './safety';

dotenv.config();

export function createApp() {
	const app = express();
	app.use(cors());
	app.use(express.json({ limit: '1mb' }));
	app.use(morgan('dev'));

	app.get('/health', (_req, res) => {
		res.json({ ok: true, service: 'agent7-messaging' });
	});

	app.use('/auth', authRouter);
	app.use('/keys', requireJwt, keysRouter);
	app.use('/groups', requireJwt, groupsRouter);
	app.use('/messages', requireJwt, getMissedMessagesRouter);
	app.use('/safety', requireJwt, safetyRouter);

	return app;
}

