import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { eventsRouter } from './routes/events';
import { rsvpsRouter } from './routes/rsvps';
import { startReminderScheduler } from './lib/reminderScheduler';
import promBundle from 'express-prom-bundle';
import { randomUUID } from 'crypto';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());
// Metrics
const metricsMiddleware = promBundle({ includeMethod: true, includePath: true, includeStatusCode: true, promClient: { collectDefaultMetrics: {} } });
app.use(metricsMiddleware);

// Structured JSON access logs
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const rid = req.header('x-request-id') || randomUUID();
  res.setHeader('x-request-id', rid);
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      time: new Date().toISOString(),
      level: 'info',
      service: 'events-service',
      request_id: rid,
      route: req.originalUrl,
      status: res.statusCode,
      latency_ms: duration
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(log));
  });
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.use('/api/events', eventsRouter);
app.use('/api/rsvps', rsvpsRouter);

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

