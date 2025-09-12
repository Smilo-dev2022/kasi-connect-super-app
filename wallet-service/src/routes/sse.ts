import { Router } from 'express';
import { prisma } from '../prisma.js';

export const sseRouter = Router();

// Simple in-memory broadcaster keyed by accountId
type Subscriber = {
  write: (chunk: string) => void;
};
const subscribers: Record<string, Set<Subscriber>> = {};

function subscribe(accountId: string, sub: Subscriber): () => void {
  if (!subscribers[accountId]) subscribers[accountId] = new Set();
  subscribers[accountId].add(sub);
  return () => subscribers[accountId].delete(sub);
}

async function computeBalance(accountId: string): Promise<number> {
  const credits = await prisma.transaction.aggregate({
    where: { accountId, type: 'CREDIT' },
    _sum: { amountCents: true },
  });
  const debits = await prisma.transaction.aggregate({
    where: { accountId, type: 'DEBIT' },
    _sum: { amountCents: true },
  });
  return (credits._sum.amountCents ?? 0) - (debits._sum.amountCents ?? 0);
}

export async function notifyBalance(accountId: string): Promise<void> {
  const set = subscribers[accountId];
  if (!set || set.size === 0) return;
  const balanceCents = await computeBalance(accountId);
  const payload = `data: ${JSON.stringify({ accountId, balanceCents, currency: 'USD' })}\n\n`;
  for (const sub of set) sub.write(payload);
}

sseRouter.get('/balance/:accountId', async (req, res) => {
  const { accountId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Express Response typings may not include flushHeaders; headers are already sent after setHeader

  const initial = await computeBalance(accountId);
  res.write(`data: ${JSON.stringify({ accountId, balanceCents: initial, currency: 'USD' })}\n\n`);

  const unsubscribe = subscribe(accountId, { write: res.write.bind(res) });
  req.on('close', () => {
    unsubscribe();
  });
});

