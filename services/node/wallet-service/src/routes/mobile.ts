import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/balance/:userId', async (req, res) => {
  const { userId } = req.params;
  const account = await prisma.account.findFirst({ where: { userId } });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json({ balance: account.balance, currency: account.currency, accountId: account.id });
});

router.get('/balance/stream/:userId', async (req, res) => {
  const { userId } = req.params;
  const account = await prisma.account.findFirst({ where: { userId } });
  if (!account) return res.status(404).json({ error: 'Account not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  let active = true;
  req.on('close', () => {
    active = false;
  });

  // naive poll-based SSE for placeholder. Replace with DB notifications in prod.
  let lastBalance = account.balance;
  const send = (data: unknown) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  send({ balance: lastBalance, currency: account.currency, accountId: account.id });

  const interval = setInterval(async () => {
    if (!active) {
      clearInterval(interval);
      return res.end();
    }
    const current = await prisma.account.findUnique({ where: { id: account.id } });
    if (current && current.balance !== lastBalance) {
      lastBalance = current.balance;
      send({ balance: lastBalance, currency: current.currency, accountId: current.id });
    }
  }, 2000);
});

export default router;
