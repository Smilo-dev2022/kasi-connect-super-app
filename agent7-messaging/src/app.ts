import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import client from 'prom-client';

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

  // Prometheus metrics
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });
  const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['service', 'method', 'route', 'status'] as const,
    registers: [registry],
  });
  const httpRequestDurationMs = new client.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['service', 'method', 'route', 'status'] as const,
    buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    registers: [registry],
  });

  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', registry.contentType);
    res.send(await registry.metrics());
  });

  // Timing and metrics middleware
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const service = 'agent7-messaging';
      const status = String(res.statusCode);
      const route = (req as any).route?.path ? `${req.baseUrl || ''}${(req as any).route.path}` : req.originalUrl || req.url;
      try {
        const diffNs = Number(process.hrtime.bigint() - start);
        const durationMs = diffNs / 1_000_000;
        httpRequestDurationMs.labels({ service, method: req.method, route, status }).observe(durationMs);
      } catch {}
      try {
        httpRequestsTotal.labels({ service, method: req.method, route, status }).inc();
      } catch {}
    });
    next();
  });

	app.get('/health', (_req, res) => {
		res.json({ ok: true, service: 'agent7-messaging' });
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

  // Minimal OpenAPI placeholder
  app.get('/openapi.json', (_req, res) => {
    res.json({ openapi: '3.0.0', info: { title: 'Messaging Service', version: '1.0.0' } });
  });
			return next();
		});
	}

	return app;
}

