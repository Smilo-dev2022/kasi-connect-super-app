import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { requestDuration, getMetrics, collectDefaultMetrics } from './metrics';

const app = express();
const prisma = new PrismaClient();

// Add request ID
app.use((req, res, next) => {
  (req as any).id = uuidv4();
  res.setHeader('X-Request-Id', (req as any).id);
  next();
});

morgan.token('id', (req) => (req as any).id);
app.use(morgan('[:date[clf]] :id :method :url :status :response-time ms - :res[content-length]'));


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

// Metrics middleware
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    end({ route: req.path, code: res.statusCode, method: req.method });
  });
  next();
});


app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', collectDefaultMetrics);
  res.end(await getMetrics());
});

// Placeholder routes will be mounted from modules
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import mobileRouter from './routes/mobile';
import { stablecoinRouter, internalStablecoinRouter } from './routes/stablecoin';

app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/mobile', mobileRouter);
app.use('/api/stablecoin', stablecoinRouter);
app.use('/api/internal', internalStablecoinRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Wallet service listening on port ${PORT}`);
});
