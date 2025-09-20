import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fetch from 'node-fetch';

const WALLET_SERVICE_URL = 'http://localhost:3000';
const ONRAMP_ADAPTER_URL = 'http://localhost:4015';
const WEBHOOK_SECRET = 'a-very-secret-key';

async function main() {
  console.log('--- Starting On-Ramp E2E Test ---');

  // 1. Setup: Create a user and a USDC account in the wallet-service
  const userId = `e2e-user-${Date.now()}`;
  const createAccountRes = await fetch(`${WALLET_SERVICE_URL}/api/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, currency: 'USDC' }),
  });
  assert.equal(createAccountRes.status, 201, 'Failed to create account');
  const account = await createAccountRes.json();
  console.log(`Created USDC account ${account.id} for user ${userId}`);

  // 2. Get a quote
  const quoteRes = await fetch(`${WALLET_SERVICE_URL}/api/stablecoin/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 10000, sourceCurrency: 'ZAR', targetCurrency: 'USDC' }),
  });
  assert.equal(quoteRes.status, 200, 'Failed to get quote');
  const quote = await quoteRes.json();
  console.log(`Received quote ${quote.quoteId}`);

  // 3. Create an order
  const orderRes = await fetch(`${WALLET_SERVICE_URL}/api/stablecoin/order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quoteId: quote.quoteId, userId }),
  });
  assert.equal(orderRes.status, 201, 'Failed to create order');
  const order = await orderRes.json();
  const orderId = order.id;
  console.log(`Created order ${orderId}`);

  // 4. Simulate partner webhook to onramp-adapter to mark order as complete
  const webhookPayload = {
    orderId: orderId,
    partnerStatus: 'COMPLETE',
    txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
  };
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(JSON.stringify(webhookPayload));
  const signature = hmac.digest('hex');

  const webhookRes = await fetch(`${ONRAMP_ADAPTER_URL}/onramp/webhooks/partner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Partner-Signature': signature,
    },
    body: JSON.stringify(webhookPayload),
  });
  assert.equal(webhookRes.status, 200, 'Partner webhook call failed');
  console.log('Simulated partner webhook call to onramp-adapter');

  // 5. Wait for processing and verify the user's balance
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s

  const balanceRes = await fetch(`${WALLET_SERVICE_URL}/api/mobile/balance/${userId}`);
  assert.equal(balanceRes.status, 200, 'Failed to get user balance');
  const balanceData = await balanceRes.json();

  const expectedBalance = order.cryptoAmount;
  assert.equal(balanceData.balance, expectedBalance, `Final balance is incorrect. Expected ${expectedBalance}, got ${balanceData.balance}`);
  console.log(`Verified final balance for user ${userId} is ${balanceData.balance}`);

  console.log('--- On-Ramp E2E Test Passed! ---');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
