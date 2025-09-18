// Evidence collection script: probes services and inspects code for key wiring
import fs from 'node:fs/promises';
import path from 'node:path';

const MOD = process.env.MOD_API || process.env.NEXT_PUBLIC_MOD_API_BASE || 'http://localhost:8082';
const EVENTS = process.env.EVENTS_API || process.env.VITE_EVENTS_API || 'http://localhost:3000';
const WALLET = process.env.WALLET_API || process.env.VITE_WALLET_API || 'http://localhost:8000';
const SEARCH = process.env.SEARCH_API || 'http://localhost:4009';
const AUTH = process.env.AUTH_API || process.env.VITE_AUTH_API || 'http://localhost:4010';

async function probe(url) {
  try {
    const res = await fetch(url, { method: 'GET' });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function collect() {
  const results = { ts: new Date().toISOString(), services: {}, code: {} };

  // Moderation
  results.services.moderation = {
    health: await probe(`${MOD}/api/health`),
    appeals: await probe(`${MOD}/api/appeals`),
    metrics: await probe(`${MOD}/metrics`),
  };

  // Events
  results.services.events = {
    events: await probe(`${EVENTS}/api/events`),
    metrics: await probe(`${EVENTS}/metrics`),
  };

  // Wallet
  results.services.wallet = {
    metrics: await probe(`${WALLET}/metrics`),
  };

  // Search
  results.services.search = {
    health: await probe(`${SEARCH}/health`),
    metrics: await probe(`${SEARCH}/metrics`),
  };

  // Auth
  results.services.auth = {
    healthz: await probe(`${AUTH}/healthz`),
  };

  // Code checks: GA snippet present, admin pages exist
  try {
    const layoutPath = path.resolve('web-admin/app/layout.tsx');
    const layout = await fs.readFile(layoutPath, 'utf8');
    results.code.web_admin_ga = /googletagmanager\.com\/gtag\/js\?id=/.test(layout) && /gtag\('config'/.test(layout);
  } catch { results.code.web_admin_ga = false; }

  const filesToCheck = [
    'web-admin/app/reports/page.tsx',
    'web-admin/app/appeals/page.tsx',
    'web-admin/app/transparency/page.tsx',
    'moderation_service/app/api.py',
  ];
  for (const f of filesToCheck) {
    try {
      await fs.access(path.resolve(f));
      results.code[f] = true;
    } catch { results.code[f] = false; }
  }

  return results;
}

const out = await collect();
console.log(JSON.stringify(out, null, 2));

