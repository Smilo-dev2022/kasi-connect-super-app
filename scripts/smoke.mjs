import assert from 'node:assert/strict';
import fetch from 'node-fetch';

const WALLET = process.env.VITE_WALLET_API || 'http://localhost:8000';
const EVENTS = process.env.VITE_EVENTS_API || 'http://localhost:3000';
const MOD = process.env.MOD_API || 'http://localhost:8002';

async function walletFlow() {
  const create = await fetch(`${WALLET}/wallet/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_id: 'group-demo', requester_id: 'user-demo', amount_cents: 1000 }) });
  assert.equal(create.status, 201);
  const req = await create.json();
  const accept = await fetch(`${WALLET}/wallet/requests/${req.id}/accept?actor_id=peer-1`, { method: 'POST' });
  assert.equal(accept.status, 200);
  const pay = await fetch(`${WALLET}/wallet/requests/${req.id}/pay?payer_id=peer-1`, { method: 'POST' });
  assert.equal(pay.status, 200);
  const metrics = await fetch(`${WALLET}/metrics`);
  assert.equal(metrics.status, 200);
}

async function eventsFlow() {
  const list = await fetch(`${EVENTS}/api/events`);
  assert.equal(list.status, 200);
  const data = await list.json();
  const id = data?.events?.[0]?.id || data?.[0]?.id;
  assert.ok(id, 'no events to RSVP');
  const r = await fetch(`${EVENTS}/api/rsvps/with-ticket`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId: id, name: 'Smoke', email: `smoke-${Date.now()}@example.com` }) });
  assert.equal(r.status, 201);
  const j = await r.json();
  const token = j?.ticket?.token;
  assert.ok(token, 'no ticket token');
  const verify = await fetch(`${EVENTS}/api/checkin/verify?token=${encodeURIComponent(token)}`);
  assert.equal(verify.status, 200);
  const checkin = await fetch(`${EVENTS}/api/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
  assert.equal(checkin.status, 200);
  const metrics = await fetch(`${EVENTS}/metrics`);
  assert.equal(metrics.status, 200);
}

async function moderationFlow() {
  const health = await fetch(`${MOD}/api/health`);
  assert.equal(health.status, 200);
  const create = await fetch(`${MOD}/api/reports`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content_id: 'c1', content_text: 'bad text', reason: 'abuse' }) });
  assert.equal(create.status, 201);
  const rep = await create.json();
  const esc = await fetch(`${MOD}/api/reports/${rep.id}/escalate`, { method: 'POST' });
  assert.equal(esc.status, 200);
  const close = await fetch(`${MOD}/api/reports/${rep.id}/close`, { method: 'POST' });
  assert.equal(close.status, 200);
  const metrics = await fetch(`${MOD}/metrics`);
  assert.equal(metrics.status, 200);
}

await walletFlow();
await eventsFlow();
await moderationFlow();
console.log('Smoke OK');

