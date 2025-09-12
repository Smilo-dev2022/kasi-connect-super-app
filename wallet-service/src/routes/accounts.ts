import { Router } from 'express';
import { prisma } from '../prisma.js';
import { z } from 'zod';

export const accountsRouter = Router();

const createAccountSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  ownerId: z.string().min(1).optional(),
});

accountsRouter.post('/', async (req, res) => {
  const parse = createAccountSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const account = await prisma.account.create({ data: parse.data });
  res.status(201).json(account);
});

accountsRouter.get('/', async (_req, res) => {
  const accounts = await prisma.account.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(accounts);
});

accountsRouter.get('/:id', async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!account) return res.status(404).json({ error: 'not found' });
  res.json(account);
});

accountsRouter.get('/:id/balance', async (req, res) => {
  const accountId = req.params.id;
  const credits = await prisma.transaction.aggregate({
    where: { accountId, type: 'CREDIT' },
    _sum: { amountCents: true },
  });
  const debits = await prisma.transaction.aggregate({
    where: { accountId, type: 'DEBIT' },
    _sum: { amountCents: true },
  });
  const creditCents = credits._sum.amountCents ?? 0;
  const debitCents = debits._sum.amountCents ?? 0;
  const balanceCents = creditCents - debitCents;
  res.json({ accountId, balanceCents, currency: 'USD' });
});

