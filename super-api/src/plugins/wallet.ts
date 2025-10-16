import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const WalletRequestCreate = z.object({
  group_id: z.string().min(1),
  requester_id: z.string().min(1),
  amount_cents: z.number().int().gte(1),
  currency: z.string().default('ZAR'),
  expires_at: z.string().datetime().optional(),
});

export default async function walletPlugin(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // CRUD for simple account/transactions if needed later
  // For now mirror Python wallet-request endpoints minimalistically

  app.post('/wallet/requests', async (request, reply) => {
    const parsed = WalletRequestCreate.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const d = parsed.data;
    const created = await prisma.walletRequest.create({
      data: {
        groupId: d.group_id,
        requesterId: d.requester_id,
        amountCents: d.amount_cents,
        currency: d.currency,
        expiresAt: d.expires_at ? new Date(d.expires_at) : null,
      },
    });
    return reply.code(201).send(created);
  });

  app.get('/wallet/requests', async (request) => {
    const q = (request.query || {}) as { group_id?: string; status?: string };
    return prisma.walletRequest.findMany({
      where: {
        ...(q.group_id ? { groupId: q.group_id } : {}),
        ...(q.status ? { status: q.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/wallet/requests/:id/accept', async (request, reply) => {
    const { id } = request.params as { id: string };
    const q = (request.query || {}) as { actor_id?: string };
    if (!q.actor_id) return reply.code(400).send({ error: 'actor_id required' });
    try {
      const updated = await prisma.walletRequest.update({ where: { id: Number(id) }, data: { status: 'accepted', acceptedBy: q.actor_id } });
      return updated;
    } catch {
      return reply.code(404).send({ error: 'Not found' });
    }
  });

  app.post('/wallet/requests/:id/cancel', async (request, reply) => {
    const { id } = request.params as { id: string };
    const q = (request.query || {}) as { actor_id?: string };
    if (!q.actor_id) return reply.code(400).send({ error: 'actor_id required' });
    try {
      const updated = await prisma.walletRequest.update({ where: { id: Number(id) }, data: { status: 'canceled', canceledBy: q.actor_id } });
      return updated;
    } catch {
      return reply.code(404).send({ error: 'Not found' });
    }
  });

  app.post('/wallet/requests/:id/pay', async (request, reply) => {
    const { id } = request.params as { id: string };
    const q = (request.query || {}) as { payer_id?: string };
    if (!q.payer_id) return reply.code(400).send({ error: 'payer_id required' });
    try {
      const updated = await prisma.$transaction(async (db) => {
        const req = await db.walletRequest.update({ where: { id: Number(id) }, data: { status: 'paid', paidBy: q.payer_id } });
        // ledger: credit requester, debit payer
        const existing = await db.ledgerEntry.findFirst({ where: { relatedRequestId: req.id } });
        if (!existing) {
          await db.groupLedger.upsert({
            where: { groupId_memberId: { groupId: req.groupId, memberId: req.requesterId } },
            update: { balanceCents: { increment: req.amountCents } },
            create: { groupId: req.groupId, memberId: req.requesterId, balanceCents: req.amountCents },
          });
          await db.groupLedger.upsert({
            where: { groupId_memberId: { groupId: req.groupId, memberId: q.payer_id } },
            update: { balanceCents: { decrement: req.amountCents } },
            create: { groupId: req.groupId, memberId: q.payer_id, balanceCents: -req.amountCents },
          });
          await db.ledgerEntry.createMany({
            data: [
              { groupId: req.groupId, memberId: req.requesterId, amountCents: req.amountCents, relatedRequestId: req.id },
              { groupId: req.groupId, memberId: q.payer_id, amountCents: -req.amountCents, relatedRequestId: req.id },
            ],
            skipDuplicates: true,
          });
        }
        return req;
      });
      return updated;
    } catch {
      return reply.code(404).send({ error: 'Not found' });
    }
  });
}
