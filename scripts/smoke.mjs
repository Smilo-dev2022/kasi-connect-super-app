/* eslint-disable no-console */
import fs from 'node:fs'
import WebSocket from 'ws'

const BASES = {
  auth: process.env.AUTH_BASE || 'http://localhost:4010',
  messaging: process.env.MSG_BASE || 'http://localhost:8080',
  media: process.env.MEDIA_BASE || 'http://localhost:4008',
  search: process.env.SEARCH_BASE || 'http://localhost:4009',
  events: process.env.EVENTS_BASE || 'http://localhost:8000',
  moderation: process.env.MOD_BASE || 'http://localhost:8082',
  wallet: process.env.WALLET_BASE || 'http://localhost:4015'
}

const results = []
const startedAt = Date.now()

async function step(name, fn) {
  const t0 = Date.now()
  try {
    await fn()
    results.push({ name, ok: true, ms: Date.now() - t0 })
  } catch (e) {
    results.push({ name, ok: false, ms: Date.now() - t0, error: String(e?.message || e) })
  }
}

async function httpOk(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
}

async function run() {
  await step('auth.health', async () => httpOk(`${BASES.auth}/healthz`))

  let token
  await step('auth.dev-token', async () => {
    const res = await fetch(`${BASES.auth}/auth/dev-token`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: 'smoke-user' })
    })
    if (!res.ok) throw new Error('dev-token failed')
    const data = await res.json()
    token = data.token
  })

  await step('messaging.health', async () => httpOk(`${BASES.messaging}/health`))
  await step('messaging.ws.invalid', async () => {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(`${BASES.messaging.replace('http', 'ws')}/ws?token=invalid`)
      ws.on('close', (code) => { if (code === 1008) resolve(); else reject(new Error(`code ${code}`)) })
      ws.on('error', reject)
    })
  })
  await step('messaging.ws.valid', async () => {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(`${BASES.messaging.replace('http', 'ws')}/ws?token=${token}`)
      ws.on('open', () => { ws.close(); resolve() })
      ws.on('error', reject)
    })
  })

  await step('media.health', async () => httpOk(`${BASES.media}/healthz`))
  await step('media.presign+upload', async () => {
    const pres = await fetch(`${BASES.media}/uploads/presign`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contentType: 'image/png', fileName: 'smoke.png' }) })
    if (!pres.ok) throw new Error('presign failed')
    const { url, headers } = await pres.json()
    const put = await fetch(url, { method: 'PUT', headers, body: new Uint8Array([137,80,78,71]) })
    if (!put.ok) throw new Error('upload failed')
  })

  await step('search.health', async () => httpOk(`${BASES.search}/health`))
  await step('search.index+query', async () => {
    const id = `smoke_${Date.now()}`
    const ix = await fetch(`${BASES.search}/messages/index`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, conversation_id: 'c1', sender_id: 'u1', text: 'hello world', created_at: Date.now(), type: 'text' }) })
    if (!ix.ok) throw new Error('index failed')
    const q = await fetch(`${BASES.search}/messages/search?q=hello&per_page=1`)
    if (!q.ok) throw new Error('query failed')
  })

  await step('moderation.health', async () => httpOk(`${BASES.moderation}/api/health`))
  let reportId
  await step('moderation.create', async () => {
    const res = await fetch(`${BASES.moderation}/api/reports`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ content_id: 'post1', content_text: 'abuse text', reason: 'harassment', reporter_id: 'u1' }) })
    if (!res.ok) throw new Error('create failed')
    const data = await res.json(); reportId = data.id
  })
  await step('moderation.list', async () => httpOk(`${BASES.moderation}/api/reports?status=pending`))
  await step('moderation.status', async () => {
    const res = await fetch(`${BASES.moderation}/api/reports/${reportId}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'in_review' }) })
    if (!res.ok) throw new Error('status failed')
  })
  await step('moderation.action', async () => {
    const res = await fetch(`${BASES.moderation}/api/reports/${reportId}/action`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ actor_id: 'admin', action: 'note', notes: 'checking' }) })
    if (!res.ok) throw new Error('action failed')
  })

  await step('wallet.health', async () => httpOk(`${BASES.wallet}/healthz`))
  let paymentId
  await step('wallet.request', async () => {
    const res = await fetch(`${BASES.wallet}/payments/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: 'merchant1', amount: 10, currency: 'ZAR' }) })
    if (!res.ok) throw new Error('wallet request failed')
    const data = await res.json(); paymentId = data.id
  })
  await step('wallet.mark-paid', async () => {
    const res = await fetch(`${BASES.wallet}/payments/${paymentId}/mark-paid`, { method: 'POST' })
    if (!res.ok) throw new Error('wallet mark-paid failed')
  })

  const summary = {
    startedAt,
    finishedAt: Date.now(),
    total: results.length,
    passed: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results
  }
  fs.writeFileSync('scripts/smoke.json', JSON.stringify(summary, null, 2))
  console.log(`Smoke: ${summary.passed}/${summary.total} passed`)
  if (summary.failed > 0) process.exit(1)
}

run().catch((e) => { console.error(e); process.exit(1) })
