import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock RSVP API calls
const mockRSVPAPI = {
  createRSVP: vi.fn(),
  updateRSVP: vi.fn(),
  deleteRSVP: vi.fn(),
  getRSVPsByEvent: vi.fn(),
  getRSVPsByUser: vi.fn(),
  generateQRCode: vi.fn(),
  validateQRCode: vi.fn(),
  checkInWithQR: vi.fn(),
  getEventAttendance: vi.fn(),
};

// Component for testing RSVP functionality
const RSVPComponent = () => {
  const [rsvps, setRSVPs] = React.useState<Array<{
    id: string;
    eventId: string;
    userId: string;
    status: 'pending' | 'confirmed' | 'declined';
    createdAt: string;
  }>>([]);
  const [currentRSVP, setCurrentRSVP] = React.useState<{
    eventId: string;
    status: string;
  } | null>(null);

  const handleCreateRSVP = async (eventId: string, userId: string) => {
    try {
      const result = await mockRSVPAPI.createRSVP({ eventId, userId, status: 'pending' });
      setRSVPs(prev => [...prev, result]);
      setCurrentRSVP({ eventId, status: 'pending' });
    } catch (error) {
      console.error('RSVP creation failed:', error);
    }
  };

  const handleUpdateRSVP = async (rsvpId: string, status: 'confirmed' | 'declined') => {
    try {
      const result = await mockRSVPAPI.updateRSVP(rsvpId, { status });
      setRSVPs(prev => prev.map(r => r.id === rsvpId ? { ...r, status } : r));
      setCurrentRSVP(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('RSVP update failed:', error);
    }
  };

  const handleDeleteRSVP = async (rsvpId: string) => {
    try {
      await mockRSVPAPI.deleteRSVP(rsvpId);
      setRSVPs(prev => prev.filter(r => r.id !== rsvpId));
      setCurrentRSVP(null);
    } catch (error) {
      console.error('RSVP deletion failed:', error);
    }
  };

  const handleLoadEventRSVPs = async (eventId: string) => {
    try {
      const result = await mockRSVPAPI.getRSVPsByEvent(eventId);
      setRSVPs(result.rsvps);
    } catch (error) {
      console.error('Failed to load event RSVPs:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleCreateRSVP('event-123', 'user-456')}
        data-testid="create-rsvp-btn"
      >
        Create RSVP
      </button>
      
      <button 
        onClick={() => handleUpdateRSVP('rsvp-789', 'confirmed')}
        data-testid="confirm-rsvp-btn"
      >
        Confirm RSVP
      </button>
      
      <button 
        onClick={() => handleUpdateRSVP('rsvp-789', 'declined')}
        data-testid="decline-rsvp-btn"
      >
        Decline RSVP
      </button>
      
      <button 
        onClick={() => handleDeleteRSVP('rsvp-789')}
        data-testid="delete-rsvp-btn"
      >
        Delete RSVP
      </button>
      
      <button 
        onClick={() => handleLoadEventRSVPs('event-123')}
        data-testid="load-rsvps-btn"
      >
        Load Event RSVPs
      </button>

      <div data-testid="rsvp-count">RSVPs: {rsvps.length}</div>
      
      {currentRSVP && (
        <div data-testid="current-rsvp">
          Event: {currentRSVP.eventId} - Status: {currentRSVP.status}
        </div>
      )}

      <div data-testid="rsvp-list">
        {rsvps.map(rsvp => (
          <div key={rsvp.id} data-testid={`rsvp-${rsvp.id}`}>
            {rsvp.eventId} - {rsvp.userId} - {rsvp.status}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component for testing QR check-in functionality
const QRCheckInComponent = () => {
  const [qrCode, setQRCode] = React.useState<string>('');
  const [checkInStatus, setCheckInStatus] = React.useState<string>('');
  const [attendanceData, setAttendanceData] = React.useState<{
    totalRSVPs: number;
    checkedIn: number;
    pending: number;
  } | null>(null);

  const handleGenerateQR = async (eventId: string, userId: string) => {
    try {
      const result = await mockRSVPAPI.generateQRCode({ eventId, userId });
      setQRCode(result.qrCode);
    } catch (error) {
      console.error('QR generation failed:', error);
    }
  };

  const handleCheckIn = async (qrCodeData: string) => {
    try {
      setCheckInStatus('checking');
      const result = await mockRSVPAPI.checkInWithQR(qrCodeData);
      setCheckInStatus(result.success ? 'success' : 'failed');
    } catch (error) {
      console.error('Check-in failed:', error);
      setCheckInStatus('failed');
    }
  };

  const handleValidateQR = async (qrCodeData: string) => {
    try {
      const result = await mockRSVPAPI.validateQRCode(qrCodeData);
      return result.valid;
    } catch (error) {
      console.error('QR validation failed:', error);
      return false;
    }
  };

  const handleGetAttendance = async (eventId: string) => {
    try {
      const result = await mockRSVPAPI.getEventAttendance(eventId);
      setAttendanceData(result);
    } catch (error) {
      console.error('Failed to get attendance:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleGenerateQR('event-123', 'user-456')}
        data-testid="generate-qr-btn"
      >
        Generate QR
      </button>
      
      <button 
        onClick={() => handleCheckIn('qr-data-abc123')}
        data-testid="checkin-btn"
      >
        Check In
      </button>
      
      <button 
        onClick={() => handleValidateQR('qr-data-abc123')}
        data-testid="validate-qr-btn"
      >
        Validate QR
      </button>
      
      <button 
        onClick={() => handleGetAttendance('event-123')}
        data-testid="get-attendance-btn"
      >
        Get Attendance
      </button>

      {qrCode && (
        <div data-testid="qr-code">QR: {qrCode}</div>
      )}
      
      <div data-testid="checkin-status">{checkInStatus}</div>
      
      {attendanceData && (
        <div data-testid="attendance-data">
          Total: {attendanceData.totalRSVPs}, 
          Checked In: {attendanceData.checkedIn}, 
          Pending: {attendanceData.pending}
        </div>
      )}
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('RSVP Endpoints Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('RSVP CRUD Operations', () => {
    it('should create a new RSVP', async () => {
      const mockRSVP = {
        id: 'rsvp-789',
        eventId: 'event-123',
        userId: 'user-456',
        status: 'pending' as const,
        createdAt: '2024-01-01T10:00:00Z'
      };

      mockRSVPAPI.createRSVP.mockResolvedValue(mockRSVP);

      render(
        <TestWrapper>
          <RSVPComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-rsvp-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByTestId('rsvp-count').textContent).toBe('RSVPs: 1');
        expect(screen.getByTestId('current-rsvp').textContent).toBe('Event: event-123 - Status: pending');
      });

      expect(mockRSVPAPI.createRSVP).toHaveBeenCalledWith({
        eventId: 'event-123',
        userId: 'user-456',
        status: 'pending'
      });
    });

    it('should update RSVP status to confirmed', async () => {
      const updatedRSVP = {
        id: 'rsvp-789',
        eventId: 'event-123',
        userId: 'user-456',
        status: 'confirmed' as const
      };

      mockRSVPAPI.updateRSVP.mockResolvedValue(updatedRSVP);

      render(
        <TestWrapper>
          <RSVPComponent />
        </TestWrapper>
      );

      // Simulate existing RSVP
      const createBtn = screen.getByTestId('create-rsvp-btn');
      fireEvent.click(createBtn);

      const confirmBtn = screen.getByTestId('confirm-rsvp-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.getByTestId('current-rsvp').textContent).toContain('confirmed');
      });

      expect(mockRSVPAPI.updateRSVP).toHaveBeenCalledWith('rsvp-789', { status: 'confirmed' });
    });

    it('should update RSVP status to declined', async () => {
      const updatedRSVP = {
        id: 'rsvp-789',
        eventId: 'event-123',
        userId: 'user-456',
        status: 'declined' as const
      };

      mockRSVPAPI.updateRSVP.mockResolvedValue(updatedRSVP);

      render(
        <TestWrapper>
          <RSVPComponent />
        </TestWrapper>
      );

      // Create then decline
      fireEvent.click(screen.getByTestId('create-rsvp-btn'));
      fireEvent.click(screen.getByTestId('decline-rsvp-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('current-rsvp').textContent).toContain('declined');
      });

      expect(mockRSVPAPI.updateRSVP).toHaveBeenCalledWith('rsvp-789', { status: 'declined' });
    });

    it('should delete an RSVP', async () => {
      mockRSVPAPI.deleteRSVP.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <RSVPComponent />
        </TestWrapper>
      );

      // Create then delete
      fireEvent.click(screen.getByTestId('create-rsvp-btn'));
      await waitFor(() => expect(screen.getByTestId('rsvp-count').textContent).toBe('RSVPs: 1'));

      fireEvent.click(screen.getByTestId('delete-rsvp-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('rsvp-count').textContent).toBe('RSVPs: 0');
        expect(screen.queryByTestId('current-rsvp')).not.toBeInTheDocument();
      });

      expect(mockRSVPAPI.deleteRSVP).toHaveBeenCalledWith('rsvp-789');
    });

    it('should load RSVPs for an event', async () => {
      const mockEventRSVPs = {
        rsvps: [
          { id: 'rsvp-1', eventId: 'event-123', userId: 'user-1', status: 'confirmed' as const, createdAt: '2024-01-01T10:00:00Z' },
          { id: 'rsvp-2', eventId: 'event-123', userId: 'user-2', status: 'pending' as const, createdAt: '2024-01-01T10:01:00Z' },
          { id: 'rsvp-3', eventId: 'event-123', userId: 'user-3', status: 'declined' as const, createdAt: '2024-01-01T10:02:00Z' }
        ]
      };

      mockRSVPAPI.getRSVPsByEvent.mockResolvedValue(mockEventRSVPs);

      render(
        <TestWrapper>
          <RSVPComponent />
        </TestWrapper>
      );

      const loadBtn = screen.getByTestId('load-rsvps-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(screen.getByTestId('rsvp-count').textContent).toBe('RSVPs: 3');
        expect(screen.getByTestId('rsvp-rsvp-1')).toBeInTheDocument();
        expect(screen.getByTestId('rsvp-rsvp-2')).toBeInTheDocument();
        expect(screen.getByTestId('rsvp-rsvp-3')).toBeInTheDocument();
      });

      expect(mockRSVPAPI.getRSVPsByEvent).toHaveBeenCalledWith('event-123');
    });

    it('should handle RSVP creation errors', async () => {
      mockRSVPAPI.createRSVP.mockRejectedValue(new Error('Event is full'));

      render(
        <TestWrapper>
          <RSVPComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-rsvp-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByTestId('rsvp-count').textContent).toBe('RSVPs: 0');
      });

      expect(mockRSVPAPI.createRSVP).toHaveBeenCalledTimes(1);
    });
  });

  describe('QR Check-in System', () => {
    it('should generate QR code for RSVP', async () => {
      const mockQRResult = {
        qrCode: 'qr-abc123-event123-user456',
        expiresAt: '2024-01-01T12:00:00Z'
      };

      mockRSVPAPI.generateQRCode.mockResolvedValue(mockQRResult);

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const generateBtn = screen.getByTestId('generate-qr-btn');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('qr-code').textContent).toBe('QR: qr-abc123-event123-user456');
      });

      expect(mockRSVPAPI.generateQRCode).toHaveBeenCalledWith({
        eventId: 'event-123',
        userId: 'user-456'
      });
    });

    it('should successfully check in with valid QR code', async () => {
      mockRSVPAPI.checkInWithQR.mockResolvedValue({
        success: true,
        attendeeInfo: {
          name: 'John Doe',
          rsvpId: 'rsvp-789',
          checkInTime: '2024-01-01T10:30:00Z'
        }
      });

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const checkInBtn = screen.getByTestId('checkin-btn');
      fireEvent.click(checkInBtn);

      await waitFor(() => {
        expect(screen.getByTestId('checkin-status').textContent).toBe('success');
      });

      expect(mockRSVPAPI.checkInWithQR).toHaveBeenCalledWith('qr-data-abc123');
    });

    it('should handle check-in failure with invalid QR code', async () => {
      mockRSVPAPI.checkInWithQR.mockResolvedValue({
        success: false,
        error: 'Invalid or expired QR code'
      });

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const checkInBtn = screen.getByTestId('checkin-btn');
      fireEvent.click(checkInBtn);

      await waitFor(() => {
        expect(screen.getByTestId('checkin-status').textContent).toBe('failed');
      });
    });

    it('should validate QR code before check-in', async () => {
      mockRSVPAPI.validateQRCode.mockResolvedValue({
        valid: true,
        eventId: 'event-123',
        userId: 'user-456',
        rsvpStatus: 'confirmed'
      });

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const validateBtn = screen.getByTestId('validate-qr-btn');
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.validateQRCode).toHaveBeenCalledWith('qr-data-abc123');
      });
    });

    it('should get event attendance data', async () => {
      const mockAttendance = {
        totalRSVPs: 50,
        checkedIn: 30,
        pending: 20,
        declinedAfterRSVP: 0
      };

      mockRSVPAPI.getEventAttendance.mockResolvedValue(mockAttendance);

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const attendanceBtn = screen.getByTestId('get-attendance-btn');
      fireEvent.click(attendanceBtn);

      await waitFor(() => {
        expect(screen.getByTestId('attendance-data').textContent).toContain('Total: 50');
        expect(screen.getByTestId('attendance-data').textContent).toContain('Checked In: 30');
        expect(screen.getByTestId('attendance-data').textContent).toContain('Pending: 20');
      });

      expect(mockRSVPAPI.getEventAttendance).toHaveBeenCalledWith('event-123');
    });

    it('should show check-in progress', async () => {
      // Simulate delayed check-in
      mockRSVPAPI.checkInWithQR.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true }), 100)
        )
      );

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const checkInBtn = screen.getByTestId('checkin-btn');
      fireEvent.click(checkInBtn);

      // Should show checking status immediately
      expect(screen.getByTestId('checkin-status').textContent).toBe('checking');

      // Should complete after delay
      await waitFor(() => {
        expect(screen.getByTestId('checkin-status').textContent).toBe('success');
      });
    });

    it('should handle QR code expiration', async () => {
      mockRSVPAPI.validateQRCode.mockResolvedValue({
        valid: false,
        error: 'QR code has expired'
      });

      mockRSVPAPI.checkInWithQR.mockResolvedValue({
        success: false,
        error: 'QR code has expired'
      });

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const checkInBtn = screen.getByTestId('checkin-btn');
      fireEvent.click(checkInBtn);

      await waitFor(() => {
        expect(screen.getByTestId('checkin-status').textContent).toBe('failed');
      });
    });

    it('should handle network errors during check-in', async () => {
      mockRSVPAPI.checkInWithQR.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <QRCheckInComponent />
        </TestWrapper>
      );

      const checkInBtn = screen.getByTestId('checkin-btn');
      fireEvent.click(checkInBtn);

      await waitFor(() => {
        expect(screen.getByTestId('checkin-status').textContent).toBe('failed');
      });
    });
  });

  describe('Events Service Request ID Logging', () => {
    // Mock logger for events service
    const mockEventsLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    };

    // Mock events API with logging
    const mockEventsAPI = {
      createEvent: vi.fn(),
      getEventById: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
    };

    const EventsLoggingComponent = () => {
      const [logs, setLogs] = React.useState<string[]>([]);
      const [events, setEvents] = React.useState<Array<{ id: string; title: string; date: string }>>([]);

      const createEventWithLogging = async (eventData: { title: string; date: string }) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          mockEventsLogger.info(`Creating event with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'create_event',
            event_title: eventData.title,
          });

          const result = await mockEventsAPI.createEvent(eventData);
          
          mockEventsLogger.info(`Event created successfully with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'create_event_success',
            event_id: result.id,
          });

          setEvents(prev => [...prev, result]);
          setLogs(prev => [...prev, `create_success:${requestId}`]);
        } catch (error) {
          mockEventsLogger.error(`Event creation failed with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'create_event_error',
            error: (error as Error).message,
          });
          setLogs(prev => [...prev, `create_error:${requestId}`]);
        }
      };

      const getEventWithLogging = async (eventId: string) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          mockEventsLogger.info(`Fetching event with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'get_event',
            event_id: eventId,
          });

          const result = await mockEventsAPI.getEventById(eventId);
          
          mockEventsLogger.info(`Event fetched successfully with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'get_event_success',
            event_id: result.id,
          });

          setLogs(prev => [...prev, `get_success:${requestId}`]);
        } catch (error) {
          mockEventsLogger.error(`Event fetch failed with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'get_event_error',
            event_id: eventId,
            error: (error as Error).message,
          });
          setLogs(prev => [...prev, `get_error:${requestId}`]);
        }
      };

      return (
        <div>
          <button 
            onClick={() => createEventWithLogging({ title: 'Test Event', date: '2024-02-01' })} 
            data-testid="create-event-logging-btn"
          >
            Create Event with Logging
          </button>
          <button 
            onClick={() => getEventWithLogging('event-123')} 
            data-testid="get-event-logging-btn"
          >
            Get Event with Logging
          </button>
          <div data-testid="events-logs-count">{logs.length}</div>
          <div data-testid="events-count">{events.length}</div>
          {logs.map((log, index) => (
            <div key={index} data-testid={`events-log-${index}`}>{log}</div>
          ))}
        </div>
      );
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should include request_id in event creation logs', async () => {
      mockEventsAPI.createEvent.mockResolvedValue({
        id: 'event-456',
        title: 'Test Event',
        date: '2024-02-01',
        createdAt: '2024-01-01T10:00:00Z',
      });

      render(
        <TestWrapper>
          <EventsLoggingComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-event-logging-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockEventsLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Creating event with request_id:'),
          expect.objectContaining({
            request_id: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
            action: 'create_event',
            event_title: 'Test Event',
          })
        );
      });
    });

    it('should include request_id in event fetch logs', async () => {
      mockEventsAPI.getEventById.mockResolvedValue({
        id: 'event-123',
        title: 'Existing Event',
        date: '2024-01-15',
      });

      render(
        <TestWrapper>
          <EventsLoggingComponent />
        </TestWrapper>
      );

      const getBtn = screen.getByTestId('get-event-logging-btn');
      fireEvent.click(getBtn);

      await waitFor(() => {
        expect(mockEventsLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Fetching event with request_id:'),
          expect.objectContaining({
            request_id: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
            action: 'get_event',
            event_id: 'event-123',
          })
        );
      });
    });

    it('should maintain consistent request_id across success logs', async () => {
      mockEventsAPI.createEvent.mockResolvedValue({
        id: 'event-789',
        title: 'Test Event',
        date: '2024-02-01',
      });

      render(
        <TestWrapper>
          <EventsLoggingComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-event-logging-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        const infoCalls = mockEventsLogger.info.mock.calls;
        expect(infoCalls).toHaveLength(2);
        
        const startLog = infoCalls[0][1];
        const successLog = infoCalls[1][1];
        
        expect(startLog.request_id).toBe(successLog.request_id);
        expect(startLog.action).toBe('create_event');
        expect(successLog.action).toBe('create_event_success');
      });
    });

    it('should log errors with request_id in events service', async () => {
      mockEventsAPI.getEventById.mockRejectedValue(new Error('Event not found'));

      render(
        <TestWrapper>
          <EventsLoggingComponent />
        </TestWrapper>
      );

      const getBtn = screen.getByTestId('get-event-logging-btn');
      fireEvent.click(getBtn);

      await waitFor(() => {
        expect(mockEventsLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('Event fetch failed with request_id:'),
          expect.objectContaining({
            request_id: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
            action: 'get_event_error',
            event_id: 'event-123',
            error: 'Event not found',
          })
        );
      });
    });

    it('should generate unique request_ids for concurrent requests', async () => {
      mockEventsAPI.createEvent.mockResolvedValue({ id: 'event-new' });

      render(
        <TestWrapper>
          <EventsLoggingComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-event-logging-btn');
      
      // Fire multiple requests quickly
      fireEvent.click(createBtn);
      await new Promise(resolve => setTimeout(resolve, 5)); // Small delay
      fireEvent.click(createBtn);

      await waitFor(() => {
        const infoCalls = mockEventsLogger.info.mock.calls;
        expect(infoCalls.length).toBeGreaterThanOrEqual(4); // 2 start + 2 success calls
        
        // Extract request_ids from start calls
        const requestIds = infoCalls
          .filter(call => call[1].action === 'create_event')
          .map(call => call[1].request_id);
        
        expect(requestIds).toHaveLength(2);
        expect(requestIds[0]).not.toBe(requestIds[1]);
      });
    });
  });
});