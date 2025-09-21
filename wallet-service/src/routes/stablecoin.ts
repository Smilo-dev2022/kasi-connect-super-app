import { Router } from 'express';
import { PrismaClient, OnrampStatus } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';
import { onrampOrderCounter } from '../metrics';

const publicRouter = Router();
const internalRouter = Router();
const prisma = new PrismaClient();

const ONRAMP_ADAPTER_BASE_URL = process.env.ONRAMP_API_BASE || 'http://onramp-adapter:4015';

// POST /api/stablecoin/quote - Get a quote from the onramp-adapter
const quoteSchema = z.object({
  amount: z.number().int().positive(),
  sourceCurrency: z.string(),
  targetCurrency: z.string(),
  side: z.enum(['BUY', 'SELL']),
});
publicRouter.post('/quote', async (req, res, next) => {
  try {
    const { amount, sourceCurrency, targetCurrency, side } = quoteSchema.parse(req.body);

    const response = await axios.post(`${ONRAMP_ADAPTER_BASE_URL}/onramp/quote`, {
      amount,
      sourceCurrency,
      targetCurrency,
      side,
    });

    res.json(response.data);
  } catch (err) {
    next(err);
  }
});

// POST /api/stablecoin/order - Create an onramp order
const createOrderSchema = z.object({
  quoteId: z.string(),
  userId: z.string(), // This would come from auth
});

publicRouter.post('/order', async (req, res, next) => {
  try {
    const { quoteId, userId } = createOrderSchema.parse(req.body);

    // Call the onramp-adapter to create the order with the partner
    const adapterResponse = await axios.post(`${ONRAMP_ADAPTER_BASE_URL}/onramp/orders`, {
      quoteId,
      // In a real app, we'd have a full KYC reference and payer details
      kycRef: `kyc_${userId}`,
      payer: { name: 'Mock Payer', accountNumber: '123456' },
    });

    const orderFromAdapter = adapterResponse.data;

    // Create a corresponding OnrampOrder in our own database
    const ourOrder = await prisma.onrampOrder.create({
      data: {
        id: orderFromAdapter.id,
        userId: userId,
        side: 'BUY',
        status: 'PENDING_FIAT',
        fiatCurrency: orderFromAdapter.fiat.currency,
        fiatAmount: orderFromAdapter.fiat.amount,
        cryptoCurrency: orderFromAdapter.crypto.currency,
        cryptoAmount: orderFromAdapter.crypto.amount,
        partner: 'MOCK', // This would be dynamic based on the adapter
        quoteId: quoteId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Mock expiry
      },
    });

    onrampOrderCounter.inc({ partner: ourOrder.partner });
    console.log(`[${(req as any).id}] OnrampOrder ${ourOrder.id} created for user ${userId}`);

    res.status(201).json(ourOrder);
  } catch (err) {
    next(err);
  }
});

// POST /api/internal/onramp-update - Webhook for onramp-adapter to call
const onrampUpdateSchema = z.object({
  orderId: z.string(),
  status: z.nativeEnum(OnrampStatus),
  partnerTxRef: z.string().optional(),
});

internalRouter.post('/onramp-update', async (req, res, next) => {
  try {
    const { orderId, status, partnerTxRef } = onrampUpdateSchema.parse(req.body);

    const order = await prisma.onrampOrder.update({
      where: { id: orderId },
      data: { status, partnerTxRef },
    });

    // If the order is completed, credit the user's wallet
    if (status === 'COMPLETED') {
      const account = await prisma.account.findFirst({
        where: { userId: order.userId, currency: order.cryptoCurrency },
      });

      if (!account) {
        throw new Error(`Account not found for user ${order.userId} with currency ${order.cryptoCurrency}`);
      }

      // Use a database transaction to ensure atomicity
      await prisma.$transaction(async (txClient) => {
        const newBalance = account.balance + order.cryptoAmount;

        await txClient.transaction.create({
          data: {
            accountId: account.id,
            amount: order.cryptoAmount,
            type: 'CREDIT',
            description: `On-ramp from ${order.fiatCurrency}`,
            balanceAfter: newBalance,
            onrampOrderId: order.id,
            partnerTxRef: partnerTxRef,
          },
        });

        await txClient.account.update({
          where: { id: account.id },
          data: { balance: newBalance },
        });
      });

      console.log(`Successfully credited ${order.cryptoAmount} ${order.cryptoCurrency} to user ${order.userId}`);
    }

    res.status(200).json({ status: 'received' });
  } catch (err) {
    next(err);
  }
});


// POST /api/stablecoin/payout - Create a payout (sell) order
const createPayoutSchema = z.object({
  userId: z.string(),
  quoteId: z.string(),
  bankDetails: z.object({
    accountNumber: z.string(),
    bankCode: z.string(),
    recipientName: z.string(),
  }),
});

publicRouter.post('/payout', async (req, res, next) => {
  try {
    const { userId, quoteId, bankDetails } = createPayoutSchema.parse(req.body);

    // 1. Get quote details from adapter
    const quoteResponse = await axios.get(`${ONRAMP_ADAPTER_BASE_URL}/onramp/quote/${quoteId}`);
    const quote = quoteResponse.data;
    const cryptoAmount = quote.amount; // In a SELL quote, the base amount is the crypto amount
    const fiatAmount = cryptoAmount * quote.rate; // This is an estimate

    // 2. Debit the user's account
    const account = await prisma.account.findFirst({
      where: { userId, currency: 'USDC' },
    });

    if (!account) {
      return res.status(404).json({ error: 'No USDC account found for user.' });
    }
    if (account.balance < cryptoAmount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // 3. Create the debit transaction and the SELL order in our DB
    const orderId = `sell_${new Date().getTime()}`;
    const debitTx = await prisma.$transaction(async (txClient) => {
      const newBalance = account.balance - cryptoAmount;

      await txClient.onrampOrder.create({
        data: {
          id: orderId,
          userId: userId,
          side: 'SELL',
          status: 'PROCESSING',
          fiatCurrency: 'ZAR',
          fiatAmount: fiatAmount,
          cryptoCurrency: 'USDC',
          cryptoAmount: cryptoAmount,
          partner: 'MOCK',
          quoteId: quoteId,
          expiresAt: new Date(quote.expiresAt),
        },
      });

      return txClient.transaction.create({
        data: {
          accountId: account.id,
          amount: cryptoAmount,
          type: 'DEBIT',
          description: 'Stablecoin payout (SELL)',
          balanceAfter: newBalance,
          onrampOrderId: orderId,
        },
      });
    });

    // 4. If successful, call the adapter to initiate the external payout
    try {
      await axios.post(`${ONRAMP_ADAPTER_BASE_URL}/onramp/payouts`, {
        amount: cryptoAmount,
        currency: 'USDC',
        bankDetails,
      });
      console.log(`Successfully initiated payout for order ${orderId}`);
    } catch (adapterError) {
      console.error(`Adapter payout failed for ${orderId}, needs reconciliation:`, adapterError.message);
      await prisma.onrampOrder.update({ where: { id: orderId }, data: { status: 'FAILED' } });
    }

    res.status(201).json({ orderId, transactionId: debitTx.id });

  } catch (err) {
    next(err);
  }
});


export { publicRouter as stablecoinRouter, internalRouter as internalStablecoinRouter };
