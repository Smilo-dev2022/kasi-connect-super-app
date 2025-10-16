import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
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

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Minimal OpenAPI document
const openapiDoc = {
  openapi: '3.0.3',
  info: { title: 'Wallet Service API', version: '0.1.0' },
  paths: {
    '/health': { get: { responses: { '200': { description: 'ok' } } } },
    '/api/accounts': {
      get: { responses: { '200': { description: 'list accounts' } } },
      post: { responses: { '201': { description: 'created' }, '400': { description: 'bad request' } } },
    },
    '/api/accounts/{id}': { get: { responses: { '200': { description: 'get account' }, '404': { description: 'not found' } } } },
    '/api/transactions': {
      get: { responses: { '200': { description: 'list transactions' } } },
      post: { responses: { '201': { description: 'created' }, '400': { description: 'bad request' } } },
    },
    '/api/transactions/account/{accountId}': { get: { responses: { '200': { description: 'list account transactions' } } } },
    '/api/mobile/balance/{userId}': { get: { responses: { '200': { description: 'balance' }, '404': { description: 'not found' } } } },
  },
} as const;

app.get('/openapi.json', (_req, res) => {
  res.json(openapiDoc);
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
