import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const dateString = z.string().datetime({ offset: true }).or(z.string());
const EventBase = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startsAt: dateString,
  endsAt: dateString.optional(),
});
const NewEventInput = EventBase;
const UpdateEventInput = EventBase.partial();

export default async function eventsPlugin(app: FastifyInstance, _opts: FastifyPluginOptions) {
  app.get('/events', async () => {
    const items = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } });
    return items;
  });

  app.get('/events/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const item = await prisma.event.findUnique({ where: { id } });
    if (!item) return reply.code(404).send({ error: 'Not Found' });
    return item;
  });

  app.post('/events', async (request, reply) => {
    const parsed = NewEventInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const payload = parsed.data;
    const created = await prisma.event.create({
      data: {
        title: payload.title,
        description: payload.description,
        location: payload.location,
        startsAt: new Date(payload.startsAt),
        endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
      },
    });
    return reply.code(201).send(created);
  });

  app.put('/events/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdateEventInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send(parsed.error.flatten());
    const payload = parsed.data;
    try {
      const updated = await prisma.event.update({
        where: { id },
        data: {
          ...('title' in payload ? { title: payload.title } : {}),
          ...('description' in payload ? { description: payload.description } : {}),
          ...('location' in payload ? { location: payload.location } : {}),
          ...('startsAt' in payload ? { startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined } : {}),
          ...('endsAt' in payload ? { endsAt: payload.endsAt ? new Date(payload.endsAt) : null } : {}),
        },
      });
      return updated;
    } catch (err: any) {
      return reply.code(404).send({ error: 'Not Found' });
    }
  });

  app.delete('/events/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.event.delete({ where: { id } });
      return reply.code(204).send();
    } catch {
      return reply.code(404).send({ error: 'Not Found' });
    }
  });
}
