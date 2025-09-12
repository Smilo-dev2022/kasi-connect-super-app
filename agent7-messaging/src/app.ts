import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from 'helmet';

import { authRouter, requireJwt } from './auth';
import { keysRouter } from './keys';
import { groupsRouter } from './groups';
import { getMissedMessagesRouter } from './messages_http';
import { safetyRouter } from './safety';

dotenv.config();

export function createApp() {
	const app = express();
	app.set('trust proxy', 1);
	app.use(
		helmet({
			contentSecurityPolicy: false,
		})
	);

	const enforceHttps = (process.env.ENFORCE_HTTPS || 'false').toLowerCase() === 'true';
	if (enforceHttps) {
		app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
			if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
			const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
			return res.redirect(308, `https://${host}${req.originalUrl}`);
		});
	}
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

