import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { typesenseClient } from './typesense.js'

const MessageStub = z.object({
  id: z.string(),
  conversation_id: z.string(),
  sender_id: z.string(),
  text: z.string().default(''),
  created_at: z.number().int(),
  type: z.enum(['text', 'image', 'video', 'link', 'other']).default('text')
})

export type MessageStub = z.infer<typeof MessageStub>

export function registerRoutes(app: FastifyInstance): void {
  app.get('/health', async () => ({ ok: true }))

  app.post('/messages/index', async (request, reply) => {
    const parsed = MessageStub.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.format() })
    }
    const doc = parsed.data
    await typesenseClient.collections('messages').documents().upsert(doc as any)
    return { ok: true, id: doc.id }
  })

  app.get('/messages/search', async (request) => {
    const q = (request.query as Record<string, string | undefined>).q ?? ''
    const per_page = parseInt((request.query as any).per_page ?? '10', 10)
    const page = parseInt((request.query as any).page ?? '1', 10)
    const type = (request.query as any).type as string | undefined
    const conversation_id = (request.query as any).conversation_id as string | undefined
    const sender_id = (request.query as any).sender_id as string | undefined

    const filters: string[] = []
    if (type) filters.push(`type:=${type}`)
    if (conversation_id) filters.push(`conversation_id:=${conversation_id}`)
    if (sender_id) filters.push(`sender_id:=${sender_id}`)

    const searchParameters = {
      q: q || '*',
      query_by: 'text,conversation_id,sender_id,type',
      per_page,
      page,
      facet_by: 'conversation_id,sender_id,type',
      filter_by: filters.length ? filters.join(' && ') : undefined
    }

    const results = await typesenseClient
      .collections('messages')
      .documents()
      .search(searchParameters as any)

    return {
      hits: results.hits?.map((h: any) => h.document) ?? [],
      found: results.found ?? 0,
      page: results.page ?? page,
      facet_counts: results.facet_counts ?? []
    }
  })
}
