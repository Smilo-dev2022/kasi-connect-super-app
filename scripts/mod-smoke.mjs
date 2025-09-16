import assert from 'node:assert/strict';

const MOD = process.env.MOD_API || process.env.NEXT_PUBLIC_MOD_API_BASE || 'http://localhost:8082';

async function moderationFlow() {
  const health = await fetch(`${MOD}/api/health`);
  assert.equal(health.status, 200, `health ${health.status}`);

  const create = await fetch(`${MOD}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_id: `smoke-${Date.now()}`, content_text: 'bad text', reason: 'abuse' })
  });
  assert.equal(create.status, 201, `create ${create.status}`);
  const rep = await create.json();
  assert.ok(rep?.id, 'missing report id');

  const esc = await fetch(`${MOD}/api/reports/${rep.id}/escalate`, { method: 'POST' });
  assert.equal(esc.status, 200, `escalate ${esc.status}`);

  const close = await fetch(`${MOD}/api/reports/${rep.id}/close`, { method: 'POST' });
  assert.equal(close.status, 200, `close ${close.status}`);

  const metrics = await fetch(`${MOD}/metrics`);
  assert.equal(metrics.status, 200, `metrics ${metrics.status}`);
}

await moderationFlow();
console.log('Moderation smoke OK');

