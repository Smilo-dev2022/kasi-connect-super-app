import assert from 'node:assert/strict';

const base = process.env.BASE || 'http://127.0.0.1:8081';

const j = (r) => r.json();

const main = async () => {
  const health = await fetch(`${base}/health`).then(j);
  assert.equal(health.status, 'ok');

  const metrics = await fetch(`${base}/metrics`).then((r) => r.text());
  assert(metrics.includes('http_requests_total'));

  const dev = await fetch(`${base}/api/auth/dev-token`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: 'smoke-user' })
  }).then(j);
  assert.ok(dev.token);
  const me = await fetch(`${base}/api/me`, { headers: { authorization: `Bearer ${dev.token}` } }).then(j);
  assert.equal(me.sub, 'smoke-user');

  console.log('smoke ok');
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
