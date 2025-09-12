import { Router } from 'express';
import { prisma } from '../prisma.js';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { notifyBalance } from './sse.js';

export const transactionsRouter = Router();

const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  type: z.enum(['CREDIT', 'DEBIT']),
  amountCents: z.number().int().positive(),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  metadata: z.any().optional(),
});

transactionsRouter.post('/', async (req, res) => {
  const parse = createTransactionSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { accountId, ...data } = parse.data;
  const exists = await prisma.account.findUnique({ where: { id: accountId } });
  if (!exists) return res.status(404).json({ error: 'account not found' });
  const tx = await prisma.transaction.create({
    data: {
      ...data,
      accountId,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  });
  await notifyBalance(accountId);
  res.status(201).json(tx);
});

transactionsRouter.get('/by-account/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const txs = await prisma.transaction.findMany({
    where: { accountId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(txs);
});

