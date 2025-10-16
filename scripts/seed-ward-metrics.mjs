#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE = process.env.EVENTS_API || 'http://localhost:8000';
const WARDS = (process.env.WARDS || 'Ward 48').split(',').map(s => s.trim()).filter(Boolean);
const INTERVAL_MS = Number(process.env.INTERVAL_MS || 30000);
const SOURCE = process.env.SOURCE || 'seed-script';

async function postOnce(ward) {
  const payload = { ward, source: SOURCE, payload: JSON.stringify({ ts: Date.now() }) };
  const url = `${BASE}/api/metrics/ward`;
  const res = await fetch(url + `?ward=${encodeURIComponent(ward)}&source=${encodeURIComponent(SOURCE)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('Failed to post ward metric', ward, res.status, text);
    return false;
  }
  const j = await res.json();
  console.log('Ingested ward metric', j.ward, j.received_at);
  return true;
}

async function main() {
  console.log('Seeding ward metrics to', BASE, 'wards:', WARDS.join(', '), 'interval', INTERVAL_MS, 'ms');
  // Post immediately once for all wards, then repeat at interval
  await Promise.all(WARDS.map(w => postOnce(w)));
  setInterval(() => {
    WARDS.forEach(w => { void postOnce(w); });
  }, INTERVAL_MS);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
