import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, OnrampStatus, OnrampSide } from '@prisma/client';

const router = Router();

// Optional simple admin bearer token guard to avoid conflicts with other teams
const adminToken = process.env.ADMIN_TOKEN;
router.use((req, res, next) => {
  if (!adminToken) return next();
  const auth = req.header('authorization');
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  if (auth.slice('Bearer '.length) !== adminToken) return res.status(403).json({ error: 'Forbidden' });
  next();
});
const prisma = new PrismaClient();

const createOrderSchema = z.object({
  side: z.nativeEnum(OnrampSide),
  fiatCurrency: z.string().min(1),
  cryptoAsset: z.string().min(1),
  fiatAmountCents: z.number().int().positive(),
  cryptoAmountBaseUnits: z.number().int().positive(),
  partnerRef: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

router.post('/orders', async (req, res, next) => {
  try {
    const body = createOrderSchema.parse(req.body);
    (req as any).metrics?.onrampQuoteCounter?.inc();
    const order = await prisma.onrampOrder.create({
      data: {
        side: body.side,
        status: OnrampStatus.PENDING_FIAT,
        fiatCurrency: body.fiatCurrency,
        cryptoAsset: body.cryptoAsset,
        fiatAmountCents: body.fiatAmountCents,
        cryptoAmountBaseUnits: body.cryptoAmountBaseUnits,
        partnerRef: body.partnerRef,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await prisma.onrampOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

router.get('/orders/:id/receipt', async (req, res, next) => {
  try {
    const order = await prisma.onrampOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    const transactions = await prisma.transaction.findMany({ where: { onrampOrderId: order.id }, orderBy: { createdAt: 'desc' } });
    const latestTx = transactions[0] || null;
    res.json({ order, transaction: latestTx });
  } catch (err) {
    next(err);
  }
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OnrampStatus),
  partnerRef: z.string().optional(),
});

router.post('/orders/:id/status', async (req, res, next) => {
  try {
    const body = updateStatusSchema.parse(req.body);
    const updated = await prisma.onrampOrder.update({
      where: { id: req.params.id },
      data: { status: body.status, partnerRef: body.partnerRef },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

const linkTxSchema = z.object({
  transactionId: z.string().min(1),
  partnerRef: z.string().optional(),
  txHash: z.string().optional(),
});

router.post('/orders/:id/link-transaction', async (req, res, next) => {
  try {
    const body = linkTxSchema.parse(req.body);
    const order = await prisma.onrampOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updatedTx = await prisma.transaction.update({
      where: { id: body.transactionId },
      data: { onrampOrderId: order.id, partnerRef: body.partnerRef, txHash: body.txHash },
    });
    res.json(updatedTx);
  } catch (err) {
    next(err);
  }
});

// Settle an order by creating a ledger Transaction and marking order COMPLETED
const settleSchema = z.object({
  accountId: z.string().min(1),
  creditAmount: z.number().positive(),
  description: z.string().optional(),
  partnerRef: z.string().optional(),
  txHash: z.string().optional(),
});

router.post('/orders/:id/settle', async (req, res, next) => {
  try {
    const body = settleSchema.parse(req.body);
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.onrampOrder.findUnique({ where: { id: req.params.id } });
      if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
      if (order.status === OnrampStatus.COMPLETED) {
        return { order, transaction: null };
      }

      const account = await tx.account.findUnique({ where: { id: body.accountId } });
      if (!account) throw Object.assign(new Error('Account not found'), { status: 404 });

      // Optional per-transaction cap (in ZAR) for pilot
      const capRands = process.env.WALLET_MAX_TX_RANDS ? Number(process.env.WALLET_MAX_TX_RANDS) : undefined;
      if (capRands && body.creditAmount > capRands) {
        throw Object.assign(new Error('Amount exceeds per-transaction cap'), { status: 400 });
      }

      const newBalance = account.balance + body.creditAmount;
      const transaction = await tx.transaction.create({
        data: {
          accountId: account.id,
          amount: body.creditAmount,
          type: 'CREDIT',
          description: body.description ?? `Onramp ${order.cryptoAsset} -> ${order.fiatCurrency}`,
          balanceAfter: newBalance,
          onrampOrderId: order.id,
          partnerRef: body.partnerRef,
          txHash: body.txHash,
        },
      });
      await tx.account.update({ where: { id: account.id }, data: { balance: newBalance } });
      const updatedOrder = await tx.onrampOrder.update({ where: { id: order.id }, data: { status: OnrampStatus.COMPLETED } });
      return { order: updatedOrder, transaction };
    });

    (req as any).metrics?.onrampSettleCounter?.inc();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

