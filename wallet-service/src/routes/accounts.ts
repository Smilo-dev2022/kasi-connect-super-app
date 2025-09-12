import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const createAccountSchema = z.object({
  userId: z.string().min(1),
  currency: z.string().default('USD'),
});

router.get('/', async (_req, res) => {
  const accounts = await prisma.account.findMany();
  res.json(accounts);
});

router.post('/', async (req, res, next) => {
  try {
    const body = createAccountSchema.parse(req.body);
    const account = await prisma.account.create({
      data: {
        userId: body.userId,
        currency: body.currency,
      },
    });
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res) => {
  const account = await prisma.account.findUnique({ where: { id: req.params.id } });
  if (!account) return res.status(404).json({ error: 'Not found' });
  res.json(account);
});

export default router;
