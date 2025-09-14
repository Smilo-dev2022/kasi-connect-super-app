import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { z } from 'zod';
import { ulid } from 'ulid';
import { randomUUID } from 'node:crypto';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: false }));
app.use(express.json());
app.use(morgan('dev'));

// JSON request logs + metrics
let walletRequestTotal = 0;
let walletMarkPaidTotal = 0;
const durations: number[] = [];
function p95(values: number[]): number { if (values.length === 0) return 0; const s = [...values].sort((a,b)=>a-b); return s[Math.floor(0.95*(s.length-1))]; }
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const reqId = (req.header('x-request-id') as string) || randomUUID();
  res.setHeader('x-request-id', reqId);
  res.on('finish', () => {
    const ms = Date.now() - start;
    durations.push(ms);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ time: new Date().toISOString(), level: 'info', service: 'wallet', request_id: reqId, route: req.originalUrl, status: res.statusCode, latency_ms: ms }));
  });
  next();
});

type Payment = { id: string; from: string; to: string; amount: number; currency: string; status: 'requested' | 'paid' | 'failed'; created_at: string };
const idempotency = new Map<string, string>();
const payments = new Map<string, Payment>();

app.get('/healthz', (_req: Request, res: Response) => res.json({ ok: true, service: 'wallet' }));

const RequestBody = z.object({ to: z.string().min(1), amount: z.number().positive(), currency: z.string().default('ZAR') });
app.post('/payments/request', (req: Request, res: Response) => {
  const parsed = RequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const idem = req.header('idempotency-key');
  if (idem && idempotency.has(idem)) {
    const existingId = idempotency.get(idem)!;
    return res.status(200).json(payments.get(existingId));
  }
  const id = ulid();
  const p: Payment = { id, from: 'user', to: parsed.data.to, amount: parsed.data.amount, currency: parsed.data.currency, status: 'requested', created_at: new Date().toISOString() };
  payments.set(id, p);
  if (idem) idempotency.set(idem, id);
  walletRequestTotal += 1;
  res.status(201).json(p);
});

app.post('/payments/:id/mark-paid', (req: Request, res: Response) => {
  const p = payments.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not_found' });
  p.status = 'paid';
  walletMarkPaidTotal += 1;
  res.json(p);
});

app.get('/payments', (_req: Request, res: Response) => {
  res.json(Array.from(payments.values()).sort((a, b) => a.created_at.localeCompare(b.created_at)));
});

app.post('/webhook/payment', (req: Request, res: Response) => {
  const sig = req.header('x-wallet-signature') || '';
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ time: new Date().toISOString(), level: 'info', service: 'wallet', route: '/webhook/payment', signature: sig }));
  res.json({ ok: true });
});

app.get('/metrics', (_req: Request, res: Response) => {
  res.type('text/plain').send(
    `wallet_request_total ${walletRequestTotal}\n` +
    `wallet_mark_paid_total ${walletMarkPaidTotal}\n` +
    `http_latency_ms_p95 ${p95(durations)}\n`
  );
});

app.use((_req: Request, res: Response) => res.status(404).json({ error: 'Not Found' }));
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => res.status(500).json({ error: err?.message || 'Internal Error' }));

const port = Number(process.env.PORT || 4015);
app.listen(port, () => console.log(`Wallet listening on http://localhost:${port}`));
