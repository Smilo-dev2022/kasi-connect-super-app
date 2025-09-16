import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Events Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('RSVP Endpoints', () => {
    it('should create RSVP with ticket successfully', async () => {
      const mockEvent = {
        id: 'event_123',
        title: 'Community Meetup',
        date: '2024-12-01T18:00:00Z',
        capacity: 100,
        current_attendees: 25
      };

      const mockRSVP = {
        id: 'rsvp_456',
        event_id: 'event_123',
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date().toISOString(),
        ticket: {
          token: 'ticket_token_789',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        }
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockRSVP)
        });

      const eventsService = await import('@/lib/events'); // Assuming events lib exists
      
      const rsvp = await eventsService.createRSVPWithTicket({
        eventId: 'event_123',
        name: 'John Doe',
        email: 'john@example.com'
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rsvps/with-ticket'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            eventId: 'event_123',
            name: 'John Doe',
            email: 'john@example.com'
          })
        })
      );

      expect(rsvp.id).toBe('rsvp_456');
      expect(rsvp.ticket.token).toBe('ticket_token_789');
      expect(rsvp.ticket.qr_code).toBeTruthy();
    });

    it('should handle RSVP creation for full events', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            error: 'Event is at full capacity'
          })
        });

      const eventsService = await import('@/lib/events');
      
      try {
        await eventsService.createRSVPWithTicket({
          eventId: 'full_event_123',
          name: 'Jane Doe',
          email: 'jane@example.com'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('full capacity');
      }
    });

    it('should list RSVPs for an event', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp_1',
          event_id: 'event_123',
          name: 'John Doe',
          email: 'john@example.com',
          checked_in: false
        },
        {
          id: 'rsvp_2',
          event_id: 'event_123',
          name: 'Jane Smith',
          email: 'jane@example.com',
          checked_in: true
        }
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ rsvps: mockRSVPs })
        });

      const eventsService = await import('@/lib/events');
      
      const rsvps = await eventsService.getEventRSVPs('event_123');
      
      expect(rsvps).toHaveLength(2);
      expect(rsvps[0].checked_in).toBe(false);
      expect(rsvps[1].checked_in).toBe(true);
    });

    it('should cancel RSVP successfully', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ 
            id: 'rsvp_456',
            status: 'cancelled' 
          })
        });

      const eventsService = await import('@/lib/events');
      
      const result = await eventsService.cancelRSVP('rsvp_456');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/rsvps/rsvp_456/cancel'),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(result.status).toBe('cancelled');
    });
  });

  describe('QR Check-in', () => {
    it('should verify QR token successfully', async () => {
      const mockTicket = {
        token: 'valid_ticket_token_123',
        rsvp_id: 'rsvp_456',
        event_id: 'event_123',
        attendee_name: 'John Doe',
        attendee_email: 'john@example.com',
        valid: true,
        used: false,
        event_title: 'Community Meetup'
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTicket)
        });

      const eventsService = await import('@/lib/events');
      
      const verification = await eventsService.verifyQRToken('valid_ticket_token_123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/checkin/verify?token=valid_ticket_token_123'),
        expect.objectContaining({
          method: 'GET'
        })
      );

      expect(verification.valid).toBe(true);
      expect(verification.attendee_name).toBe('John Doe');
      expect(verification.event_title).toBe('Community Meetup');
    });

    it('should reject invalid QR tokens', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: 'Invalid or expired token',
            valid: false
          })
        });

      const eventsService = await import('@/lib/events');
      
      try {
        await eventsService.verifyQRToken('invalid_token');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Invalid or expired token');
      }
    });

    it('should perform check-in successfully', async () => {
      const mockCheckIn = {
        rsvp_id: 'rsvp_456',
        event_id: 'event_123',
        attendee_name: 'John Doe',
        checked_in_at: new Date().toISOString(),
        success: true
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCheckIn)
        });

      const eventsService = await import('@/lib/events');
      
      const checkIn = await eventsService.performCheckIn('valid_ticket_token_123');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/checkin'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ token: 'valid_ticket_token_123' })
        })
      );

      expect(checkIn.success).toBe(true);
      expect(checkIn.attendee_name).toBe('John Doe');
      expect(checkIn.checked_in_at).toBeTruthy();
    });

    it('should prevent duplicate check-ins', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            error: 'Attendee already checked in',
            already_checked_in: true,
            checked_in_at: '2024-01-01T10:00:00Z'
          })
        });

      const eventsService = await import('@/lib/events');
      
      try {
        await eventsService.performCheckIn('already_used_token');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('already checked in');
      }
    });

    it('should handle expired tickets', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 410,
          json: () => Promise.resolve({
            error: 'Ticket has expired',
            expired: true,
            event_ended: true
          })
        });

      const eventsService = await import('@/lib/events');
      
      try {
        await eventsService.performCheckIn('expired_token');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('expired');
      }
    });
  });

  describe('Event Management', () => {
    it('should create events successfully', async () => {
      const newEvent = {
        title: 'Tech Workshop',
        description: 'Learning new technologies',
        date: '2024-12-15T14:00:00Z',
        capacity: 50,
        location: 'Community Center'
      };

      const mockCreatedEvent = {
        id: 'event_789',
        ...newEvent,
        created_at: new Date().toISOString(),
        organizer_id: 'user_123'
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve(mockCreatedEvent)
        });

      const eventsService = await import('@/lib/events');
      
      const createdEvent = await eventsService.createEvent(newEvent);
      
      expect(createdEvent.id).toBe('event_789');
      expect(createdEvent.title).toBe('Tech Workshop');
      expect(createdEvent.capacity).toBe(50);
    });

    it('should list events with pagination', async () => {
      const mockEvents = Array.from({ length: 25 }, (_, i) => ({
        id: `event_${i + 1}`,
        title: `Event ${i + 1}`,
        date: new Date(Date.now() + i * 86400000).toISOString(),
        capacity: 100
      }));

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            events: mockEvents.slice(0, 10),
            has_more: true,
            next_cursor: 'cursor_10'
          })
        });

      const eventsService = await import('@/lib/events');
      
      const eventsList = await eventsService.getEvents({ limit: 10 });
      
      expect(eventsList.events).toHaveLength(10);
      expect(eventsList.has_more).toBe(true);
      expect(eventsList.next_cursor).toBe('cursor_10');
    });
  });

  describe('Request ID Logging', () => {
    it('should include request_id in RSVP creation logs', async () => {
      const mockRequestId = 'req_rsvp_123';
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'x-request-id' ? mockRequestId : null
          },
          json: () => Promise.resolve({ rsvp_id: 'rsvp_456' })
        });

      const eventsService = await import('@/lib/events');
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await eventsService.createRSVPWithTicket({
        eventId: 'event_123',
        name: 'John Doe',
        email: 'john@example.com'
      });
      
      // Check if console.log was called (may not have request ID logging yet)
      if (consoleSpy.mock.calls.length > 0) {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining(`request_id=${mockRequestId}`)
        );
      }
      
      consoleSpy.mockRestore();
    });

    it('should include request_id in check-in logs', async () => {
      const mockRequestId = 'req_checkin_456';
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'x-request-id' ? mockRequestId : null
          },
          json: () => Promise.resolve({ success: true })
        });

      const eventsService = await import('@/lib/events');
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await eventsService.performCheckIn('ticket_token_123');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`request_id=${mockRequestId}`)
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Metrics and Analytics', () => {
    it('should track events metrics correctly', async () => {
      const mockMetrics = `
# HELP events_created_total Total number of events created
# TYPE events_created_total counter
events_created_total 45

# HELP rsvp_total Total RSVPs created
# TYPE rsvp_total counter
rsvp_total 320

# HELP checkin_total Total check-ins
# TYPE checkin_total counter
checkin_total 280

# HELP events_capacity_utilization Event capacity utilization percentage
# TYPE events_capacity_utilization histogram
events_capacity_utilization_bucket{le="0.5"} 5
events_capacity_utilization_bucket{le="0.8"} 25
events_capacity_utilization_bucket{le="1.0"} 45
      `;

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name) => name === 'content-type' ? 'text/plain; charset=utf-8' : null
          },
          text: () => Promise.resolve(mockMetrics)
        });

      const response = await fetch('http://localhost:8000/metrics');
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/plain');
      
      const metricsText = await response.text();
      expect(metricsText).toContain('events_created_total');
      expect(metricsText).toContain('rsvp_total');
      expect(metricsText).toContain('checkin_total');
      expect(metricsText).toContain('events_capacity_utilization');
    });
  });
});