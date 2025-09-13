import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { z } from 'zod';
import { ulid } from 'ulid';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: false }));
app.use(express.json());
app.use(morgan('dev'));

type Payment = { id: string; from: string; to: string; amount: number; currency: string; status: 'requested' | 'paid' | 'failed'; created_at: string };
const payments = new Map<string, Payment>();

app.get('/healthz', (_req: Request, res: Response) => res.json({ ok: true, service: 'wallet' }));

const RequestBody = z.object({ to: z.string().min(1), amount: z.number().positive(), currency: z.string().default('ZAR') });
app.post('/payments/request', (req: Request, res: Response) => {
  const parsed = RequestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const id = ulid();
  const p: Payment = { id, from: 'user', to: parsed.data.to, amount: parsed.data.amount, currency: parsed.data.currency, status: 'requested', created_at: new Date().toISOString() };
  payments.set(id, p);
  res.status(201).json(p);
});

app.post('/payments/:id/mark-paid', (req: Request, res: Response) => {
  const p = payments.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not_found' });
  p.status = 'paid';
  res.json(p);
});

app.get('/payments', (_req: Request, res: Response) => {
  res.json(Array.from(payments.values()).sort((a, b) => a.created_at.localeCompare(b.created_at)));
});

app.use((_req: Request, res: Response) => res.status(404).json({ error: 'Not Found' }));
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => res.status(500).json({ error: err?.message || 'Internal Error' }));

const port = Number(process.env.PORT || 4015);
app.listen(port, () => console.log(`Wallet listening on http://localhost:${port}`));
