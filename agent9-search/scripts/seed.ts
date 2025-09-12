import 'dotenv/config'
import { typesenseClient, ensureMessagesCollection } from '../src/typesense.js'

async function run(): Promise<void> {
  await ensureMessagesCollection()

  const now = Date.now()
  const docs = Array.from({ length: 20 }).map((_, idx) => ({
    id: `m-${idx + 1}`,
    conversation_id: `c-${Math.ceil((idx + 1) / 5)}`,
    sender_id: `u-${(idx % 3) + 1}`,
    text: `Hello world ${idx + 1} — quick brown fox jumps over the lazy dog ${idx % 5 === 0 ? 'link' : 'text'}`,
    created_at: now - idx * 1000,
    type: idx % 5 === 0 ? 'link' : 'text'
  }))

  await typesenseClient.collections('messages').documents().import(docs as any, {
    action: 'upsert'
  } as any)

  // eslint-disable-next-line no-console
  console.log('Seeded', docs.length, 'docs')
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
