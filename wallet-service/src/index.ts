import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import client from 'prom-client';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'), false as any);
  },
  credentials: true,
}));
app.use(express.json());
app.use(morgan(process.env.LOG_LEVEL || 'dev'));

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

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const service = 'wallet';
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
  res.json({ ok: true });
});

// Placeholder routes will be mounted from modules
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import mobileRouter from './routes/mobile';

app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/mobile', mobileRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Wallet service listening on port ${PORT}`);
});
