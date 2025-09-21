import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';
import client, { Counter, Histogram, Registry } from 'prom-client';

const app = express();

app.use(cors({ origin: config.corsOrigin, credentials: false }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Prometheus metrics
const registry: Registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['service', 'method', 'route', 'status'] as const,
  registers: [registry]
});
const httpRequestDurationMs = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in ms',
  labelNames: ['service', 'method', 'route', 'status'] as const,
  buckets: [5,10,25,50,100,250,500,1000,2500,5000],
  registers: [registry]
});

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    try {
      const route = (req.route && (req.baseUrl + req.route.path)) || req.originalUrl || req.url;
      const status = String(res.statusCode);
      const diffNs = Number(process.hrtime.bigint() - start);
      const latencyMs = diffNs / 1_000_000;
      httpRequestCounter.labels('auth', req.method, route, status).inc();
      httpRequestDurationMs.labels('auth', req.method, route, status).observe(latencyMs);
    } catch {}
  });
  next();
});

app.get('/metrics', async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
});

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

