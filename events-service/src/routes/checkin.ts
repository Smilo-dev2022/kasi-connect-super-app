import { Router, Request, Response } from 'express';
import { getRsvpById, getTicketByToken, markTicketCheckedIn, getEventById } from '../lib/storage';

export const checkinRouter = Router();

// Verify a token and return ticket + rsvp + event
checkinRouter.get('/verify', (req: Request, res: Response) => {
  const token = (req.query.token as string) || '';
  const ticket = getTicketByToken(token);
  if (!ticket) return res.status(404).json({ ok: false, error: 'ticket_not_found' });
  const rsvp = getRsvpById(ticket.rsvpId);
  const event = rsvp ? getEventById(rsvp.eventId) : undefined;
  return res.json({
    ok: true,
    ticket: {
      id: ticket.id,
      rsvpId: ticket.rsvpId,
      token: ticket.token,
      issuedAt: ticket.issuedAt,
      checkedInAt: ticket.checkedInAt ?? null,
      status: ticket.status,
    },
    rsvp: rsvp ?? null,
    event: event ?? null,
  });
});

// Check in using token
checkinRouter.post('/', (req: Request, res: Response) => {
  const token = (req.body?.token as string) || (req.query.token as string) || '';
  try {
    const { ticket, already } = markTicketCheckedIn(token);
    return res.json({ ok: true, ticketId: ticket.id, already, checkedInAt: ticket.checkedInAt });
  } catch (err: any) {
    if (err.message === 'ticket_not_found') return res.status(404).json({ ok: false, error: 'ticket_not_found' });
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }
});

