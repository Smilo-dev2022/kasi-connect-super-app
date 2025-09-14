import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { v4 as uuidv4 } from 'uuid';
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

	// JSON logging with request_id and latency + simple p95 reporting
	const durations: number[] = [];
	let reqCount = 0;
	function computeP95(values: number[]): number {
		if (values.length === 0) return 0;
		const sorted = [...values].sort((a, b) => a - b);
		const idx = Math.floor(0.95 * (sorted.length - 1));
		return sorted[idx];
	}
	app.use((req, res, next) => {
		const started = Date.now();
		const reqId = (req.headers['x-request-id'] as string) || uuidv4();
		res.setHeader('x-request-id', reqId);
		res.on('finish', () => {
			const ms = Date.now() - started;
			durations.push(ms);
			reqCount += 1;
			// eslint-disable-next-line no-console
			console.log(JSON.stringify({ ts: Date.now(), request_id: reqId, method: req.method, route: req.originalUrl, status: res.statusCode, duration_ms: ms }));
			if (reqCount % 100 === 0) {
				const p95 = computeP95(durations);
				// eslint-disable-next-line no-console
				console.log(JSON.stringify({ ts: Date.now(), metric: 'http_latency_ms_p95', value: p95 }));
				// keep array bounded
				if (durations.length > 2000) durations.splice(0, durations.length - 1000);
			}
		});
		next();
	});

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

