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
  await step('messaging.ws.send', async () => {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(`${BASES.messaging.replace('http', 'ws')}/ws?token=${token}`)
      ws.on('open', () => {
        const id = `smoke_${Date.now()}`
        ws.send(JSON.stringify({ type: 'msg', id, to: 'c1', scope: 'direct', ciphertext: 'hello' }))
        setTimeout(() => { ws.close(); resolve() }, 100)
      })
      ws.on('error', reject)
    })
  })
  await step('messaging.db.fetch', async () => {
    // For demo: assumes conversation_id 'c1' has at least one message after send
    const res = await fetch(`${BASES.messaging}/messages/since/c1?limit=1`)
    if (!res.ok) throw new Error('history failed')
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
    const res = await fetch(`${BASES.wallet}/payments/request`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': `smoke-${Date.now()}` }, body: JSON.stringify({ to: 'merchant1', amount: 10, currency: 'ZAR' }) })
    if (!res.ok) throw new Error('wallet request failed')
    const data = await res.json(); paymentId = data.id
  })
  await step('wallet.mark-paid', async () => {
    const res = await fetch(`${BASES.wallet}/payments/${paymentId}/mark-paid`, { method: 'POST' })
    if (!res.ok) throw new Error('wallet mark-paid failed')
  })
  await step('wallet.webhook', async () => {
    const res = await fetch(`${BASES.wallet}/webhook/payment`, { method: 'POST', headers: { 'x-wallet-signature': 'sig123' }, body: '{}' })
    if (!res.ok) throw new Error('wallet webhook failed')
  })

  // Optional DB checks if DATABASE_URL is provided and pg is available
  await step('db.counts', async () => {
    const dbUrl = process.env.DATABASE_URL || process.env.DB_URL
    if (!dbUrl) { results.push({ name: 'db.info', ok: true, ms: 0, info: 'DATABASE_URL not set, skipping DB assertions' }); return }
    let pg
    try { pg = await import('pg') } catch { results.push({ name: 'db.info', ok: true, ms: 0, info: 'pg client not available, skipping' }); return }
    const tryConnect = async (connUrl) => {
      const t0 = Date.now()
      const pool = new pg.Pool({ connectionString: connUrl })
      try {
        await pool.query('select 1')
        return { pool, ms: Date.now() - t0 }
      } catch (e) {
        await pool.end().catch(()=>{})
        throw e
      }
    }
    let pool, connectMs
    try {
      const conn = await tryConnect(dbUrl)
      pool = conn.pool; connectMs = conn.ms
    } catch (e) {
      // fallback: replace host 'postgres' with 'localhost'
      try {
        const u = new URL(dbUrl)
        if (u.hostname === 'postgres') { u.hostname = 'localhost' }
        const conn = await tryConnect(u.toString())
        pool = conn.pool; connectMs = conn.ms
      } catch (e2) {
        results.push({ name: 'db.connect', ok: false, ms: 0, error: String(e2?.message || e2) })
        return
      }
    }
    const counts = {}
    const timings = {}
    const q = async (label, sql) => {
      const t = Date.now();
      try {
        const res = await pool.query(sql)
        counts[label] = res.rows[0]?.c ?? 0
        timings[label] = Date.now() - t
      } catch (err) {
        counts[label] = null
        timings[label] = -1
      }
    }
    try {
      await q('messages', 'select count(*)::int as c from messages')
      await q('receipts', 'select count(*)::int as c from receipts')
      await q('reports', 'select count(*)::int as c from reports')
      await q('payment_requests', 'select count(*)::int as c from payment_requests')
    } finally {
      await pool.end().catch(()=>{})
    }
    results.push({ name: 'db.summary', ok: true, ms: connectMs, counts, timings })
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
