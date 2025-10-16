import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import client from 'prom-client';
import { PrismaClient } from '@prisma/client';
import client from 'prom-client';
import client from 'prom-client';

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

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', registry.contentType);
  const body = await registry.metrics();
  res.send(body);
});

// Prometheus metrics
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['service', 'method', 'route', 'status'] as const,
  registers: [registry],
});
app.use((req, res, next) => {
  res.on('finish', () => {
    const route = (req as any).route?.path || req.originalUrl || req.url;
    httpRequestCounter.labels({ service: 'wallet', method: req.method, route, status: String(res.statusCode) }).inc();
  });
  next();
});

app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', registry.contentType);
  res.send(await registry.metrics());
});

// Prometheus metrics
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', registry.contentType);
  res.end(await registry.metrics());
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
