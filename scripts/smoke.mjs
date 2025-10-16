import assert from 'node:assert/strict';
import fetch from 'node-fetch';

const WALLET = process.env.VITE_WALLET_API || 'http://localhost:8000';
// Prefer the Python events_service on :8001 for Week 9 freshness/metrics tests
const EVENTS = process.env.VITE_EVENTS_API || 'http://localhost:8001';
const MOD = process.env.MOD_API || 'http://localhost:8082';

async function walletFlow() {
  const health = await fetch(`${WALLET}/health`);
  assert.equal(health.status, 200);
}

async function eventsFlow() {
  const list = await fetch(`${EVENTS}/api/events`);
  assert.equal(list.status, 200);
  const data = await list.json();
  // Python service returns { ok, events: [...] }
  const id = data?.events?.[0]?.id;
  assert.ok(id, 'no events to RSVP');
  // Use HTML RSVP flow for python service
  const r = await fetch(`${EVENTS}/api/events/launch-party`);
  assert.equal(r.status, 200);
  // Verify metrics endpoints
  const metrics = await fetch(`${EVENTS}/metrics`);
  assert.equal(metrics.status, 200);
  const freshness = await fetch(`${EVENTS}/api/metrics/ward/freshness`);
  assert.equal(freshness.status, 200);
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
  // Appeals MVP list endpoint should 200
  const appeals = await fetch(`${MOD}/api/appeals`);
  assert.equal(appeals.status, 200);
}

await walletFlow();
await eventsFlow();
await moderationFlow();
console.log('Ward freshness check OK');
console.log('Smoke OK');

