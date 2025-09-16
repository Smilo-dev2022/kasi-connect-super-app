// Events service library
export async function createRSVPWithTicket(data: { eventId: string; name: string; email: string }) {
  const response = await fetch('/api/rsvps/with-ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create RSVP');
  }
  
  return response.json();
}

export async function getEventRSVPs(eventId: string) {
  const response = await fetch(`/api/events/${eventId}/rsvps`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch RSVPs');
  }
  
  const data = await response.json();
  return data.rsvps || [];
}

export async function cancelRSVP(rsvpId: string) {
  const response = await fetch(`/api/rsvps/${rsvpId}/cancel`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to cancel RSVP');
  }
  
  return response.json();
}

export async function verifyQRToken(token: string) {
  const response = await fetch(`/api/checkin/verify?token=${encodeURIComponent(token)}`, {
    method: 'GET'
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Token verification failed');
  }
  
  return response.json();
}

export async function performCheckIn(token: string) {
  const response = await fetch('/api/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  const requestId = response.headers?.get('x-request-id');
  if (requestId) {
    console.log(`Performed check-in, request_id=${requestId}`);
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Check-in failed');
  }
  
  return response.json();
}

export async function createEvent(eventData: Record<string, unknown>) {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create event');
  }
  
  return response.json();
}

export async function getEvents(options: { limit?: number; cursor?: string } = {}) {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.cursor) params.append('cursor', options.cursor);
  
  const response = await fetch(`/api/events?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  
  return response.json();
}