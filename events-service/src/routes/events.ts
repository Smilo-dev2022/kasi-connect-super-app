import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  listEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../lib/storage';
import { NewEventInputSchema, UpdateEventInputSchema } from '../models/event';

export const eventsRouter = Router();

const IdParamSchema = z.object({ id: z.string().uuid() });

eventsRouter.get('/', (_req: Request, res: Response) => {
  res.json(listEvents());
});

eventsRouter.get('/:id', (req: Request, res: Response) => {
  const params = IdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  const event = getEventById(params.data.id);
  if (!event) return res.status(404).json({ error: 'Not Found' });
  res.json(event);
});

eventsRouter.post('/', (req: Request, res: Response) => {
  const parsed = NewEventInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const created = createEvent(parsed.data);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

eventsRouter.put('/:id', (req: Request, res: Response) => {
  const params = IdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  const parsed = UpdateEventInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const updated = updateEvent(params.data.id, parsed.data);
    res.json(updated);
  } catch (err: any) {
    if (err.message === 'Event not found') return res.status(404).json({ error: 'Not Found' });
    res.status(400).json({ error: err.message });
  }
});

eventsRouter.delete('/:id', (req: Request, res: Response) => {
  const params = IdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  const ok = deleteEvent(params.data.id);
  if (!ok) return res.status(404).json({ error: 'Not Found' });
  res.status(204).send();
});