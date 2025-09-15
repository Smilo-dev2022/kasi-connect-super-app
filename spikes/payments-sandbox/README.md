## Spike: Payments provider sandbox testing (Agent 10)

Goal: Stand up a basic sandbox integration with a mainstream payments provider (start with Stripe test mode) to validate webhooks, idempotency, and refund flows.

Deliverables
- Sandbox account and API keys stored via environment variables
- Local webhook receiver (Express) and manual test using the provider's CLI
- Notes on event models and what we need to persist

Suggested path (Stripe first)
1) Install Stripe CLI and log in. Create a test PaymentIntent via CLI.
2) Run a local webhook receiver (see sample snippet below) and forward events with `stripe listen`.
3) Capture logs and document the minimal fields we need.

Sample Express receiver (for reference only; not wired yet)
```ts
// Sample only: integrate into backend when ready
import express from 'express';
import Stripe from 'stripe';

const app = express();
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Verify signature and parse event using Stripe SDK
  res.json({ ok: true });
});

app.listen(4242, () => console.log('listening on 4242'));
```

Next providers to evaluate after Stripe
- Adyen, Braintree, or PayPal (compare webhook ergonomics and sandbox fidelity)

