import { Router } from 'express';
import { z } from 'zod';
import { quoteCounter } from '../metrics';

const router = Router();

// As per the brief: currency in cents (ints), RFC3339 timestamps
const quoteRequestSchema = z.object({
  amount: z.number().int().positive(), // Amount in cents
  sourceCurrency: z.string(), // e.g., 'ZAR'
  targetCurrency: z.string(), // e.g., 'USDC'
  side: z.enum(['BUY', 'SELL']),
});

const quoteResponseSchema = z.object({
  quoteId: z.string(),
  rate: z.number(), // e.g., 18.50
  fees: z.object({
    partner: z.number().int(),
    network: z.number().int(),
    ikasi: z.number().int(),
  }),
  expiresAt: z.string().datetime(),
  estimatedArrival: z.string().datetime(),
});

import crypto from 'crypto';
import axios from 'axios';

// In-memory stores for this example. In production, use a persistent database.
const ordersStore: Map<string, any> = new Map();
const quotesStore: Map<string, any> = new Map();

// POST /onramp/quote
router.post('/quote', (req, res, next) => {
  try {
    // TODO: Add JWT validation middleware
    // TODO: Add Idempotency-Key validation middleware

    const { amount, sourceCurrency, targetCurrency, side } = quoteRequestSchema.parse(req.body);

    quoteCounter.inc({ source_currency: sourceCurrency, target_currency: targetCurrency });
    console.log(`[${(req as any).id}] ${side} Quote requested for ${amount} ${sourceCurrency} to ${targetCurrency}`);

    // This is a mock response. In a real scenario, this would call a partner like VALR.
    const quote = {
      quoteId: `q_${side.toLowerCase()}_${new Date().getTime()}`,
      rate: side === 'BUY' ? 18.55 : 18.45, // Simulate a spread
      fees: {
        partner: 500, // 5 ZAR
        network: 100, // 1 ZAR
        ikasi: 0, // Free for pilot
      },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
      estimatedArrival: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes from now
    };

    const validatedQuote = quoteResponseSchema.parse(quote);
    quotesStore.set(validatedQuote.quoteId, validatedQuote);
    res.json(validatedQuote);
  } catch (err) {
    next(err);
  }
});

// GET /onramp/quote/{id} - Get quote details
router.get('/quote/:id', (req, res) => {
  const quote = quotesStore.get(req.params.id);
  if (!quote) {
    return res.status(404).json({ error: 'Quote not found' });
  }
  res.json(quote);
});

// === Orders & Webhooks ===

const createOrderSchema = z.object({
  quoteId: z.string(),
  kycRef: z.string(), // Reference to a KYC check
  payer: z.object({
    name: z.string(),
    accountNumber: z.string(),
  }),
});

const orderStatusSchema = z.enum(['PENDING_FIAT', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED']);

const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  side: z.enum(['BUY', 'SELL']),
  fiat: z.object({ currency: z.string(), amount: z.number().int() }),
  crypto: z.object({ currency: z.string(), amount: z.number().int() }),
  events: z.array(z.object({ status: orderStatusSchema, timestamp: z.string().datetime() })),
});

// === Payouts (Off-ramp) ===

const createPayoutSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3), // e.g., 'USDC'
  bankDetails: z.object({
    accountNumber: z.string(),
    bankCode: z.string(),
    recipientName: z.string(),
  }),
});

// POST /onramp/payouts - Create a payout
router.post('/payouts', (req, res, next) => {
  try {
    const payoutRequest = createPayoutSchema.parse(req.body);
    console.log('Payout requested:', payoutRequest);

    // In a real scenario, this would call the partner's payout API.
    const payoutResponse = {
      payoutId: `pout_${new Date().getTime()}`,
      status: 'PROCESSING', // Partner status
    };

    res.status(201).json(payoutResponse);
  } catch (err) {
    next(err);
  }
});


// POST /onramp/orders - Create an order
router.post('/orders', (req, res, next) => {
  try {
    const { quoteId } = createOrderSchema.parse(req.body);

    const orderId = `ord_${new Date().getTime()}`;
    const newOrder = {
      id: orderId,
      status: 'PENDING_FIAT',
      side: 'BUY',
      fiat: { currency: 'ZAR', amount: 100000 }, // Mock data
      crypto: { currency: 'USDC', amount: 5385 }, // Mock data
      events: [{ status: 'PENDING_FIAT', timestamp: new Date().toISOString() }],
    };

    ordersStore.set(orderId, newOrder);
    console.log(`Order ${orderId} created from quote ${quoteId}.`);

    res.status(201).json(orderSchema.parse(newOrder));
  } catch (err) {
    next(err);
  }
});

// GET /onramp/orders/{id} - Get order status
router.get('/orders/:id', (req, res) => {
  const order = ordersStore.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(orderSchema.parse(order));
});

// POST /onramp/webhooks/partner - Receive partner status updates
const partnerWebhookSchema = z.object({
  orderId: z.string(),
  partnerStatus: z.string(), // e.g., "PAID", "COMPLETE", "FAILED"
  txHash: z.string().optional(),
});

const verifyHmac = (req: import('express').Request): boolean => {
  const secret = process.env.ONRAMP_WEBHOOK_SECRET;
  if (!secret) {
    console.error('ONRAMP_WEBHOOK_SECRET is not set. Cannot verify webhook.');
    return false;
  }
  const signature = req.headers['x-partner-signature'] as string;
  if (!signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(req.body));
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

router.post('/webhooks/partner', (req, res, next) => {
  if (!verifyHmac(req)) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  try {
    const { orderId, partnerStatus } = partnerWebhookSchema.parse(req.body);
    const order = ordersStore.get(orderId);

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Map partner status to our internal status
    let newStatus: z.infer<typeof orderStatusSchema> | undefined;
    switch (partnerStatus.toUpperCase()) {
      case 'PAID':
        newStatus = 'PROCESSING';
        break;
      case 'COMPLETE':
        newStatus = 'COMPLETED';
        break;
      case 'FAILED':
        newStatus = 'FAILED';
        break;
    }

    if (newStatus && order.status !== newStatus) {
      order.status = newStatus;
      order.events.push({ status: newStatus, timestamp: new Date().toISOString() });
      ordersStore.set(orderId, order);
      console.log(`Webhook updated order ${orderId} to status ${newStatus}`);

      // Notify wallet-service of the update
      const walletServiceUrl = process.env.WALLET_SERVICE_URL || 'http://wallet-service:3000';
      axios.post(`${walletServiceUrl}/api/internal/onramp-update`, {
        orderId: orderId,
        status: newStatus,
        partnerTxRef: req.body.txHash,
      }).catch(err => {
        // Log the error but don't fail the webhook response to the partner
        console.error(`Failed to notify wallet-service for order ${orderId}:`, err.message);
      });
    }

    res.status(200).json({ status: 'received' });
  } catch (err) {
    next(err);
  }
});


export default router;
