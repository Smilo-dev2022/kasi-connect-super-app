import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock RSVP API
const mockRSVPAPI = {
  createRSVP: vi.fn(),
  updateRSVP: vi.fn(),
  deleteRSVP: vi.fn(),
  getRSVPs: vi.fn(),
  checkInWithQR: vi.fn(),
  generateQRCode: vi.fn(),
  validateQRCode: vi.fn(),
};

vi.mock('@/services/rsvp', () => ({
  RSVPAPI: mockRSVPAPI,
}));

// Test component for RSVP operations
const RSVPTestComponent: React.FC = () => {
  const [rsvps, setRSVPs] = React.useState<Record<string, unknown>[]>([]);
  const [qrCode, setQRCode] = React.useState<string>('');
  const [checkInStatus, setCheckInStatus] = React.useState<string>('');
  const [qrValidation, setQRValidation] = React.useState<Record<string, unknown> | null>(null);

  const createRSVP = async (eventId: string, status: string) => {
    try {
      const rsvp = await mockRSVPAPI.createRSVP({
        eventId,
        status,
        userId: 'user-123',
        timestamp: Date.now(),
      });
      setRSVPs(prev => [...prev, rsvp]);
    } catch (error) {
      console.error('RSVP creation failed:', error);
    }
  };

  const updateRSVP = async (rsvpId: string, status: string) => {
    try {
      const updatedRSVP = await mockRSVPAPI.updateRSVP(rsvpId, { status });
      setRSVPs(prev => prev.map(r => r.id === rsvpId ? updatedRSVP : r));
    } catch (error) {
      console.error('RSVP update failed:', error);
    }
  };

  const deleteRSVP = async (rsvpId: string) => {
    try {
      await mockRSVPAPI.deleteRSVP(rsvpId);
      setRSVPs(prev => prev.filter(r => r.id !== rsvpId));
    } catch (error) {
      console.error('RSVP deletion failed:', error);
    }
  };

  const loadRSVPs = async (eventId: string) => {
    try {
      const rsvpList = await mockRSVPAPI.getRSVPs(eventId);
      setRSVPs(rsvpList);
    } catch (error) {
      console.error('Load RSVPs failed:', error);
    }
  };

  const generateQR = async (eventId: string) => {
    try {
      const qrData = await mockRSVPAPI.generateQRCode(eventId, 'user-123');
      setQRCode(qrData.qrCode);
    } catch (error) {
      console.error('QR generation failed:', error);
    }
  };

  const checkInWithQR = async (qrData: string) => {
    try {
      const result = await mockRSVPAPI.checkInWithQR(qrData);
      setCheckInStatus(result.status);
    } catch (error) {
      setCheckInStatus('error');
      console.error('QR check-in failed:', error);
    }
  };

  const validateQR = async (qrData: string) => {
    try {
      const validation = await mockRSVPAPI.validateQRCode(qrData);
      setQRValidation(validation);
    } catch (error) {
      setQRValidation({ valid: false, error: error.message });
    }
  };

  return (
    <div>
      <button
        data-testid="create-rsvp-yes-btn"
        onClick={() => createRSVP('event-123', 'yes')}
      >
        RSVP Yes
      </button>
      <button
        data-testid="create-rsvp-no-btn"
        onClick={() => createRSVP('event-123', 'no')}
      >
        RSVP No
      </button>
      <button
        data-testid="create-rsvp-maybe-btn"
        onClick={() => createRSVP('event-123', 'maybe')}
      >
        RSVP Maybe
      </button>
      <button
        data-testid="update-rsvp-btn"
        onClick={() => updateRSVP('rsvp-123', 'no')}
      >
        Update RSVP
      </button>
      <button
        data-testid="delete-rsvp-btn"
        onClick={() => deleteRSVP('rsvp-123')}
      >
        Delete RSVP
      </button>
      <button
        data-testid="load-rsvps-btn"
        onClick={() => loadRSVPs('event-123')}
      >
        Load RSVPs
      </button>
      <button
        data-testid="generate-qr-btn"
        onClick={() => generateQR('event-123')}
      >
        Generate QR
      </button>
      <button
        data-testid="checkin-qr-btn"
        onClick={() => checkInWithQR('valid-qr-data')}
      >
        Check In with QR
      </button>
      <button
        data-testid="checkin-invalid-qr-btn"
        onClick={() => checkInWithQR('invalid-qr-data')}
      >
        Check In with Invalid QR
      </button>
      <button
        data-testid="validate-qr-btn"
        onClick={() => validateQR('valid-qr-data')}
      >
        Validate QR
      </button>

      <div data-testid="rsvps-count">{rsvps.length}</div>
      <div data-testid="qr-code">{qrCode}</div>
      <div data-testid="checkin-status">{checkInStatus}</div>
      <div data-testid="qr-validation">
        {qrValidation ? JSON.stringify(qrValidation) : ''}
      </div>

      <div data-testid="rsvps-list">
        {rsvps.map((rsvp, index) => (
          <div key={rsvp.id} data-testid={`rsvp-${index}`}>
            {rsvp.status} - {rsvp.eventId}
          </div>
        ))}
      </div>
    </div>
  );
};

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

describe('RSVP and QR Check-in Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('RSVP Creation', () => {
    it('should create RSVP with "yes" status', async () => {
      const mockRSVP = {
        id: 'rsvp-123',
        eventId: 'event-123',
        userId: 'user-123',
        status: 'yes',
        timestamp: Date.now(),
      };

      mockRSVPAPI.createRSVP.mockResolvedValue(mockRSVP);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const createYesBtn = screen.getByTestId('create-rsvp-yes-btn');
      fireEvent.click(createYesBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.createRSVP).toHaveBeenCalledWith({
          eventId: 'event-123',
          status: 'yes',
          userId: 'user-123',
          timestamp: expect.any(Number),
        });
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('1');
        expect(screen.getByTestId('rsvp-0')).toHaveTextContent('yes - event-123');
      });
    });

    it('should create RSVP with "no" status', async () => {
      const mockRSVP = {
        id: 'rsvp-124',
        eventId: 'event-123',
        userId: 'user-123',
        status: 'no',
        timestamp: Date.now(),
      };

      mockRSVPAPI.createRSVP.mockResolvedValue(mockRSVP);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const createNoBtn = screen.getByTestId('create-rsvp-no-btn');
      fireEvent.click(createNoBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.createRSVP).toHaveBeenCalledWith({
          eventId: 'event-123',
          status: 'no',
          userId: 'user-123',
          timestamp: expect.any(Number),
        });
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('1');
        expect(screen.getByTestId('rsvp-0')).toHaveTextContent('no - event-123');
      });
    });

    it('should create RSVP with "maybe" status', async () => {
      const mockRSVP = {
        id: 'rsvp-125',
        eventId: 'event-123',
        userId: 'user-123',
        status: 'maybe',
        timestamp: Date.now(),
      };

      mockRSVPAPI.createRSVP.mockResolvedValue(mockRSVP);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const createMaybeBtn = screen.getByTestId('create-rsvp-maybe-btn');
      fireEvent.click(createMaybeBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.createRSVP).toHaveBeenCalledWith({
          eventId: 'event-123',
          status: 'maybe',
          userId: 'user-123',
          timestamp: expect.any(Number),
        });
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('1');
        expect(screen.getByTestId('rsvp-0')).toHaveTextContent('maybe - event-123');
      });
    });

    it('should handle RSVP creation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRSVPAPI.createRSVP.mockRejectedValue(new Error('Event not found'));

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const createYesBtn = screen.getByTestId('create-rsvp-yes-btn');
      fireEvent.click(createYesBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.createRSVP).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('RSVP creation failed:', expect.any(Error));
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('RSVP Updates', () => {
    it('should update existing RSVP status', async () => {
      const updatedRSVP = {
        id: 'rsvp-123',
        eventId: 'event-123',
        userId: 'user-123',
        status: 'no',
        timestamp: Date.now(),
      };

      mockRSVPAPI.updateRSVP.mockResolvedValue(updatedRSVP);

      // Setup initial RSVP
      const initialRSVPs = [{
        id: 'rsvp-123',
        eventId: 'event-123',
        status: 'yes',
      }];
      mockRSVPAPI.getRSVPs.mockResolvedValue(initialRSVPs);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      // Load initial RSVPs
      const loadBtn = screen.getByTestId('load-rsvps-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('1');
        expect(screen.getByTestId('rsvp-0')).toHaveTextContent('yes - event-123');
      });

      // Update RSVP
      const updateBtn = screen.getByTestId('update-rsvp-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.updateRSVP).toHaveBeenCalledWith('rsvp-123', { status: 'no' });
        expect(screen.getByTestId('rsvp-0')).toHaveTextContent('no - event-123');
      });
    });

    it('should handle RSVP update errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRSVPAPI.updateRSVP.mockRejectedValue(new Error('RSVP not found'));

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const updateBtn = screen.getByTestId('update-rsvp-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.updateRSVP).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('RSVP update failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('RSVP Deletion', () => {
    it('should delete RSVP successfully', async () => {
      mockRSVPAPI.deleteRSVP.mockResolvedValue(undefined);

      // Setup initial RSVP
      const initialRSVPs = [{
        id: 'rsvp-123',
        eventId: 'event-123',
        status: 'yes',
      }];
      mockRSVPAPI.getRSVPs.mockResolvedValue(initialRSVPs);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      // Load initial RSVPs
      const loadBtn = screen.getByTestId('load-rsvps-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('1');
      });

      // Delete RSVP
      const deleteBtn = screen.getByTestId('delete-rsvp-btn');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.deleteRSVP).toHaveBeenCalledWith('rsvp-123');
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('0');
      });
    });

    it('should handle RSVP deletion errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRSVPAPI.deleteRSVP.mockRejectedValue(new Error('Deletion failed'));

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const deleteBtn = screen.getByTestId('delete-rsvp-btn');
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.deleteRSVP).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('RSVP deletion failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('QR Code Generation', () => {
    it('should generate QR code for event check-in', async () => {
      const mockQRData = {
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        token: 'qr-token-123',
        expiresAt: Date.now() + 3600000, // 1 hour
      };

      mockRSVPAPI.generateQRCode.mockResolvedValue(mockQRData);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const generateBtn = screen.getByTestId('generate-qr-btn');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.generateQRCode).toHaveBeenCalledWith('event-123', 'user-123');
        expect(screen.getByTestId('qr-code')).toHaveTextContent(mockQRData.qrCode);
      });
    });

    it('should handle QR generation errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRSVPAPI.generateQRCode.mockRejectedValue(new Error('QR generation failed'));

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const generateBtn = screen.getByTestId('generate-qr-btn');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.generateQRCode).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('QR generation failed:', expect.any(Error));
        expect(screen.getByTestId('qr-code')).toHaveTextContent('');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('QR Code Check-in', () => {
    it('should successfully check in with valid QR code', async () => {
      const mockCheckInResult = {
        status: 'checked-in',
        timestamp: Date.now(),
        eventId: 'event-123',
        userId: 'user-123',
      };

      mockRSVPAPI.checkInWithQR.mockResolvedValue(mockCheckInResult);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const checkInBtn = screen.getByTestId('checkin-qr-btn');
      fireEvent.click(checkInBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.checkInWithQR).toHaveBeenCalledWith('valid-qr-data');
        expect(screen.getByTestId('checkin-status')).toHaveTextContent('checked-in');
      });
    });

    it('should handle invalid QR code check-in', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRSVPAPI.checkInWithQR.mockRejectedValue(new Error('Invalid QR code'));

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const checkInInvalidBtn = screen.getByTestId('checkin-invalid-qr-btn');
      fireEvent.click(checkInInvalidBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.checkInWithQR).toHaveBeenCalledWith('invalid-qr-data');
        expect(consoleSpy).toHaveBeenCalledWith('QR check-in failed:', expect.any(Error));
        expect(screen.getByTestId('checkin-status')).toHaveTextContent('error');
      });

      consoleSpy.mockRestore();
    });

    it('should handle expired QR code', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const expiredError = new Error('QR code expired');
      expiredError.name = 'ExpiredTokenError';
      mockRSVPAPI.checkInWithQR.mockRejectedValue(expiredError);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const checkInBtn = screen.getByTestId('checkin-qr-btn');
      fireEvent.click(checkInBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.checkInWithQR).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('QR check-in failed:', expect.any(Error));
        expect(screen.getByTestId('checkin-status')).toHaveTextContent('error');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('QR Code Validation', () => {
    it('should validate QR code successfully', async () => {
      const mockValidation = {
        valid: true,
        eventId: 'event-123',
        userId: 'user-123',
        expiresAt: Date.now() + 3600000,
      };

      mockRSVPAPI.validateQRCode.mockResolvedValue(mockValidation);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const validateBtn = screen.getByTestId('validate-qr-btn');
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.validateQRCode).toHaveBeenCalledWith('valid-qr-data');
        expect(screen.getByTestId('qr-validation')).toHaveTextContent(JSON.stringify(mockValidation));
      });
    });

    it('should handle invalid QR code validation', async () => {
      mockRSVPAPI.validateQRCode.mockRejectedValue(new Error('Invalid QR format'));

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const validateBtn = screen.getByTestId('validate-qr-btn');
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.validateQRCode).toHaveBeenCalledWith('valid-qr-data');
        const validationText = screen.getByTestId('qr-validation').textContent;
        expect(validationText).toContain('"valid":false');
        expect(validationText).toContain('"error":"Invalid QR format"');
      });
    });
  });

  describe('RSVP Loading', () => {
    it('should load all RSVPs for an event', async () => {
      const mockRSVPs = [
        { id: 'rsvp-1', eventId: 'event-123', status: 'yes', userId: 'user-1' },
        { id: 'rsvp-2', eventId: 'event-123', status: 'no', userId: 'user-2' },
        { id: 'rsvp-3', eventId: 'event-123', status: 'maybe', userId: 'user-3' },
      ];

      mockRSVPAPI.getRSVPs.mockResolvedValue(mockRSVPs);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const loadBtn = screen.getByTestId('load-rsvps-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.getRSVPs).toHaveBeenCalledWith('event-123');
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('3');
        expect(screen.getByTestId('rsvp-0')).toHaveTextContent('yes - event-123');
        expect(screen.getByTestId('rsvp-1')).toHaveTextContent('no - event-123');
        expect(screen.getByTestId('rsvp-2')).toHaveTextContent('maybe - event-123');
      });
    });

    it('should handle empty RSVP list', async () => {
      mockRSVPAPI.getRSVPs.mockResolvedValue([]);

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const loadBtn = screen.getByTestId('load-rsvps-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.getRSVPs).toHaveBeenCalledWith('event-123');
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('0');
      });
    });

    it('should handle RSVP loading errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRSVPAPI.getRSVPs.mockRejectedValue(new Error('Event not found'));

      render(
        <TestWrapper>
          <RSVPTestComponent />
        </TestWrapper>
      );

      const loadBtn = screen.getByTestId('load-rsvps-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(mockRSVPAPI.getRSVPs).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Load RSVPs failed:', expect.any(Error));
        expect(screen.getByTestId('rsvps-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });
  });
});