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
client.collectDefaultMetrics();
const onrampQuoteCounter = new client.Counter({ name: 'onramp_quote_requests_total', help: 'Count of quote requests' });
const onrampSettleCounter = new client.Counter({ name: 'onramp_settlements_total', help: 'Count of settlements' });
const httpDuration = new client.Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration in seconds', buckets: [0.025,0.05,0.1,0.25,0.5,1,2,5] });

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => end());
  (req as any).metrics = { onrampQuoteCounter, onrampSettleCounter };
  next();
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Config/flags endpoint for frontend
app.get('/api/config', (_req, res) => {
  res.json({
    WALLET_STABLECOIN_ENABLED: process.env.WALLET_STABLECOIN_ENABLED === 'true',
    ONRAMP_PARTNER: process.env.ONRAMP_PARTNER || null,
    STABLECOIN_ASSET: process.env.STABLECOIN_ASSET || 'USDC',
    WALLET_MAX_TX_RANDS: process.env.WALLET_MAX_TX_RANDS ? Number(process.env.WALLET_MAX_TX_RANDS) : null,
  });
});

// Placeholder routes will be mounted from modules
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import mobileRouter from './routes/mobile';
import onrampRouter from './routes/onramp';

app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/mobile', mobileRouter);
app.use('/api/onramp', onrampRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Wallet service listening on port ${PORT}`);
});
