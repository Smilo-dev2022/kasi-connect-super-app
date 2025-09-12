import Typesense from 'typesense'
import { config } from './config.js'

export const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: config.typesense.host,
      port: config.typesense.port,
      protocol: config.typesense.protocol
    }
  ],
  apiKey: config.typesense.apiKey,
  connectionTimeoutSeconds: 5
})

export async function ensureMessagesCollection(): Promise<void> {
  const schema = {
    name: 'messages',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'conversation_id', type: 'string', facet: true },
      { name: 'sender_id', type: 'string', facet: true },
      { name: 'text', type: 'string' },
      { name: 'created_at', type: 'int64' },
      { name: 'type', type: 'string', facet: true }
    ],
    default_sorting_field: 'created_at'
  }

  try {
    await typesenseClient.collections('messages').retrieve()
  } catch {
    await typesenseClient.collections().create(schema as any)
  }
}
