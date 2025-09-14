export type TicketStatus = 'valid' | 'used';

export type Ticket = {
  id: string;
  rsvpId: string;
  token: string;
  issuedAt: string;
  checkedInAt?: string;
  status: TicketStatus;
};

