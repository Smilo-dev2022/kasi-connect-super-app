import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { authRouter, requireJwt } from './auth';
import { keysRouter } from './keys';
import { groupsRouter } from './groups';
import { getMissedMessagesRouter } from './messages_http';
import { conversationsRouter } from './conversations';
import { safetyRouter } from './safety';

dotenv.config();

export function createApp() {
	const app = express();
	const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : undefined;
	app.use(cors({ origin: (corsOrigin && corsOrigin.length > 0) ? corsOrigin : '*' }));
	app.use(helmet());
	app.use(express.json({ limit: '1mb' }));
	app.use(morgan('dev'));

	app.get('/health', (_req, res) => {
		res.json({ ok: true, service: 'agent7-messaging' });
	});

	app.use('/auth', authRouter);
	app.use('/keys', requireJwt, keysRouter);
	app.use('/groups', requireJwt, groupsRouter);
	app.use('/messages', requireJwt, getMissedMessagesRouter);
	app.use('/conversations', requireJwt, conversationsRouter);
	app.use('/safety', requireJwt, safetyRouter);

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

