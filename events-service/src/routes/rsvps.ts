import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  listRsvps,
  createRsvp,
  updateRsvp,
  deleteRsvp,
  getRsvpById,
} from '../lib/storage';
import { NewRsvpInputSchema, UpdateRsvpInputSchema } from '../models/rsvp';
import { rsvpTotal } from '../lib/metrics';
import { createTicketForRsvp, getTicketByRsvpId } from '../lib/storage';

export const rsvpsRouter = Router();

const IdParamSchema = z.object({ id: z.string().uuid() });

rsvpsRouter.get('/', (req: Request, res: Response) => {
  const eventId = req.query.eventId as string | undefined;
  if (eventId) {
    const valid = z.string().uuid().safeParse(eventId);
    if (!valid.success) return res.status(400).json(valid.error.flatten());
    return res.json(listRsvps({ eventId }));
  }
  return res.json(listRsvps());
});

rsvpsRouter.get('/:id', (req: Request, res: Response) => {
  const params = IdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  const rsvp = getRsvpById(params.data.id);
  if (!rsvp) return res.status(404).json({ error: 'Not Found' });
  res.json(rsvp);
});

rsvpsRouter.post('/', (req: Request, res: Response) => {
  const parsed = NewRsvpInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const created = createRsvp(parsed.data);
    rsvpTotal.inc();
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Create RSVP and ensure a ticket exists; return both
rsvpsRouter.post('/with-ticket', (req: Request, res: Response) => {
  const parsed = NewRsvpInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const rsvp = createRsvp(parsed.data);
    const ticket = createTicketForRsvp(rsvp.id);
    rsvpTotal.inc();
    res.status(201).json({ rsvp, ticket });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

rsvpsRouter.put('/:id', (req: Request, res: Response) => {
  const params = IdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  const parsed = UpdateRsvpInputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error.flatten());
  try {
    const updated = updateRsvp(params.data.id, parsed.data);
    res.json(updated);
  } catch (err: any) {
    if (err.message === 'RSVP not found') return res.status(404).json({ error: 'Not Found' });
    res.status(400).json({ error: err.message });
  }
});

rsvpsRouter.delete('/:id', (req: Request, res: Response) => {
  const params = IdParamSchema.safeParse(req.params);
  if (!params.success) return res.status(400).json(params.error.flatten());
  const ok = deleteRsvp(params.data.id);
  if (!ok) return res.status(404).json({ error: 'Not Found' });
  res.status(204).send();
});