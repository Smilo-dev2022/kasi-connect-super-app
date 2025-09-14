import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import promBundle from 'express-prom-bundle';
import { randomUUID } from 'crypto';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
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
      service: 'auth',
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

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, service: 'auth', version: '1.0.0' });
});

app.use('/auth', authRouter);
app.use('/devices', devicesRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (config.nodeEnv !== 'test') {
    // eslint-disable-next-line no-console
    console.error('Error:', err);
  }
  res.status(statusCode).json({ error: message });
});

function start() {
  const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Auth service listening on http://localhost:${config.port}`);
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
}

start();

export default app;

