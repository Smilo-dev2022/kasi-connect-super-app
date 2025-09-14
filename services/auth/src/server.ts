import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';
import { randomUUID } from 'node:crypto';

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

// JSON logging with request_id and latency; expose simple /metrics
const durations: number[] = [];
let reqCount = 0;
function p95(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(0.95 * (s.length - 1))];
}
app.use((req: Request, res: Response, next: NextFunction) => {
  const started = Date.now();
  const reqId = (req.header('x-request-id') as string) || randomUUID();
  const corrId = (req.header('x-correlation-id') as string) || reqId;
  res.setHeader('x-request-id', reqId);
  res.setHeader('x-correlation-id', corrId);
  res.on('finish', () => {
    const ms = Date.now() - started;
    durations.push(ms);
    reqCount += 1;
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ ts: Date.now(), request_id: reqId, correlation_id: corrId, method: req.method, route: req.originalUrl, status: res.statusCode, duration_ms: ms }));
    if (durations.length > 2000) durations.splice(0, durations.length - 1000);
  });
  next();
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

app.get('/metrics', (_req: Request, res: Response) => {
  res.type('text/plain').send(
    `http_requests_total ${reqCount}\n` +
    `http_latency_ms_p95 ${p95(durations)}\n`
  );
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

