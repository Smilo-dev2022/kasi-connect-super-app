import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createTransactionSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number(),
  type: z.enum(['CREDIT', 'DEBIT']),
  description: z.string().optional(),
});

router.get('/', async (_req, res) => {
  const txs = await prisma.transaction.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(txs);
});

router.post('/', async (req, res, next) => {
  try {
    const body = createTransactionSchema.parse(req.body);
    const tx = await prisma.$transaction(async (txClient) => {
      const account = await txClient.account.findUnique({ where: { id: body.accountId } });
      if (!account) throw Object.assign(new Error('Account not found'), { status: 404 });

      if (body.type === 'DEBIT' && account.balance < body.amount) {
        throw Object.assign(new Error('Insufficient funds'), { status: 400 });
      }

      const newBalance = body.type === 'CREDIT' ? account.balance + body.amount : account.balance - body.amount;

      const createdTx = await txClient.transaction.create({
        data: {
          accountId: body.accountId,
          amount: body.amount,
          type: body.type,
          description: body.description,
          balanceAfter: newBalance,
        },
      });

      await txClient.account.update({ where: { id: body.accountId }, data: { balance: newBalance } });

      return createdTx;
    });

    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

router.get('/account/:accountId', async (req, res) => {
  const txs = await prisma.transaction.findMany({
    where: { accountId: req.params.accountId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(txs);
});

export default router;
