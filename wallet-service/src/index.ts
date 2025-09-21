import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import client, { Counter, Histogram, Registry } from 'prom-client';

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

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    try {
      const route = (req.route && (req.baseUrl + req.route.path)) || req.originalUrl || req.url;
      const status = String(res.statusCode);
      const diffNs = Number(process.hrtime.bigint() - start);
      const latencyMs = diffNs / 1_000_000;
      httpRequestCounter.labels('wallet', req.method, route, status).inc();
      httpRequestDurationMs.labels('wallet', req.method, route, status).observe(latencyMs);
    } catch {}
  });
  next();
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
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
