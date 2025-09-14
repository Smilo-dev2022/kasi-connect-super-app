import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import client from 'prom-client';
import { httpRequestCounter, httpRequestDurationMs, registry } from './lib/metrics';
import { eventsRouter } from './routes/events';
import { rsvpsRouter } from './routes/rsvps';
import { startReminderScheduler } from './lib/reminderScheduler';
import { checkinRouter } from './routes/checkin';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

// Prometheus metrics registry and collectors
// metrics are set up via shared registry in lib/metrics

// Request ID and timing middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  (req as any).startHrTime = process.hrtime.bigint();
  next();
});

// Metrics endpoint
app.get('/metrics', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', registry.contentType);
  const body = await registry.metrics();
  res.send(body);
});

// Log on response
app.use((req: Request, res: Response, next: NextFunction) => {
  const service = 'events';
  const origSend = res.send.bind(res);
  res.send = ((body?: any) => {
    try {
      const route = (req.route && (req.baseUrl + req.route.path)) || req.originalUrl || req.url;
      const status = String(res.statusCode);
      let latencyMs = 0;
      const start: bigint | undefined = (req as any).startHrTime;
      if (start) {
        const diffNs = Number(process.hrtime.bigint() - start);
        latencyMs = diffNs / 1_000_000;
        httpRequestDurationMs.labels({ service, method: req.method, route, status }).observe(latencyMs);
      }
      httpRequestCounter.labels({ service, method: req.method, route, status }).inc();
      // JSON log
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        time: new Date().toISOString(),
        level: 'info',
        service,
        request_id: (req as any).requestId,
        route,
        method: req.method,
        status: res.statusCode,
        latency_ms: latencyMs,
      }));
    } catch {
      // ignore logging errors
    }
    return origSend(body);
  }) as any;
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', eventsRouter);
app.use('/api/rsvps', rsvpsRouter);
app.use('/api/checkin', checkinRouter);

app.use(express.static(path.join(__dirname, '..', 'public')));

// Simple error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// HTTPS redirect behind proxy in production
if (process.env.NODE_ENV === 'production') {
  app.enable('trust proxy');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const proto = req.header('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const host = req.header('x-forwarded-host') || req.header('host');
      return res.redirect(301, `https://${host}${req.originalUrl}`);
    }
    return next();
  });
}

app.listen(PORT, () => {
  console.log(`Events service listening on http://localhost:${PORT}`);
  startReminderScheduler();
});

