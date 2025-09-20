import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, OnrampStatus, OnrampSide } from '@prisma/client';

const router = Router();
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

export default router;

