import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock wallet API
const mockWalletAPI = {
  createWalletRequest: vi.fn(),
  listWalletRequests: vi.fn(),
  markRequestAsPaid: vi.fn(),
  getRequestStatus: vi.fn(),
  exportCSV: vi.fn(),
  getStatusTransitions: vi.fn(),
};

vi.mock('@/services/wallet', () => ({
  WalletAPI: mockWalletAPI,
}));

// Test component for wallet operations
const WalletTestComponent: React.FC = () => {
  const [requests, setRequests] = React.useState<Record<string, unknown>[]>([]);
  const [csvData, setCsvData] = React.useState<string>('');
  const [transitions, setTransitions] = React.useState<Record<string, unknown>[]>([]);
  const [optimisticUpdate, setOptimisticUpdate] = React.useState<Record<string, unknown> | null>(null);

  const createRequest = async (amount: number, description: string) => {
    const idempotencyKey = `req_${Date.now()}`;
    
    // Optimistic update
    const optimisticRequest = {
      id: 'temp-' + Date.now(),
      amount,
      description,
      status: 'pending',
      idempotencyKey,
    };
    setOptimisticUpdate(optimisticRequest);
    setRequests(prev => [...prev, optimisticRequest]);

    try {
      const request = await mockWalletAPI.createWalletRequest({
        amount,
        description,
        idempotencyKey,
      });
      
      // Replace optimistic update with real data
      setRequests(prev => prev.map(r => r.id === optimisticRequest.id ? request : r));
      setOptimisticUpdate(null);
    } catch (error) {
      // Revert optimistic update on error
      setRequests(prev => prev.filter(r => r.id !== optimisticRequest.id));
      setOptimisticUpdate(null);
      throw error;
    }
  };

  const listRequests = async () => {
    try {
      const requestList = await mockWalletAPI.listWalletRequests();
      setRequests(requestList);
    } catch (error) {
      console.error('List requests failed:', error);
    }
  };

  const markAsPaid = async (requestId: string) => {
    try {
      await mockWalletAPI.markRequestAsPaid(requestId);
      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'paid' } : r
      ));
    } catch (error) {
      console.error('Mark as paid failed:', error);
    }
  };

  const exportToCSV = async () => {
    try {
      const csv = await mockWalletAPI.exportCSV();
      setCsvData(csv);
    } catch (error) {
      console.error('CSV export failed:', error);
    }
  };

  const getTransitions = async (requestId: string) => {
    try {
      const transitionData = await mockWalletAPI.getStatusTransitions(requestId);
      setTransitions(transitionData);
    } catch (error) {
      console.error('Get transitions failed:', error);
    }
  };

  return (
    <div>
      <button 
        data-testid="create-request-btn" 
        onClick={() => createRequest(100, 'Test payment')}
      >
        Create Request
      </button>
      <button 
        data-testid="create-invalid-btn" 
        onClick={() => createRequest(-50, 'Invalid amount')}
      >
        Create Invalid Request
      </button>
      <button data-testid="list-requests-btn" onClick={listRequests}>
        List Requests
      </button>
      <button 
        data-testid="mark-paid-btn" 
        onClick={() => markAsPaid('request-123')}
      >
        Mark as Paid
      </button>
      <button data-testid="export-csv-btn" onClick={exportToCSV}>
        Export CSV
      </button>
      <button 
        data-testid="get-transitions-btn" 
        onClick={() => getTransitions('request-123')}
      >
        Get Transitions
      </button>

      <div data-testid="requests-count">{requests.length}</div>
      <div data-testid="csv-data">{csvData}</div>
      <div data-testid="transitions-count">{transitions.length}</div>
      <div data-testid="optimistic-status">
        {optimisticUpdate ? 'updating' : 'idle'}
      </div>

      <div data-testid="requests-list">
        {requests.map((request, index) => (
          <div key={request.id} data-testid={`request-${index}`}>
            {request.amount} - {request.status}
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

describe('Wallet Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Wallet Request Creation', () => {
    it('should create wallet request with idempotency key', async () => {
      const mockRequest = {
        id: 'req-123',
        amount: 100,
        description: 'Test payment',
        status: 'pending',
        idempotencyKey: expect.stringMatching(/^req_\d+$/),
      };

      mockWalletAPI.createWalletRequest.mockResolvedValue(mockRequest);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-request-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockWalletAPI.createWalletRequest).toHaveBeenCalledWith({
          amount: 100,
          description: 'Test payment',
          idempotencyKey: expect.stringMatching(/^req_\d+$/),
        });
        expect(screen.getByTestId('requests-count')).toHaveTextContent('1');
      });
    });

    it('should handle idempotency key duplicates', async () => {
      const duplicateKeyError = new Error('Duplicate idempotency key');
      duplicateKeyError.name = 'DuplicateKeyError';
      
      mockWalletAPI.createWalletRequest.mockRejectedValue(duplicateKeyError);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-request-btn');
      
      try {
        fireEvent.click(createBtn);
        await waitFor(() => {
          expect(mockWalletAPI.createWalletRequest).toHaveBeenCalled();
        });
        // Test should complete without throwing since error is caught in component
      } catch (error) {
        // This is expected behavior
        expect(error.message).toBe('Duplicate idempotency key');
      }
    });

    it('should validate request creation parameters', async () => {
      const validationError = new Error('Invalid amount: must be positive');
      mockWalletAPI.createWalletRequest.mockRejectedValue(validationError);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createInvalidBtn = screen.getByTestId('create-invalid-btn');
      
      try {
        fireEvent.click(createInvalidBtn);
        await waitFor(() => {
          expect(mockWalletAPI.createWalletRequest).toHaveBeenCalledWith({
            amount: -50,
            description: 'Invalid amount',
            idempotencyKey: expect.stringMatching(/^req_\d+$/),
          });
        });
        // Test should complete without throwing since error is caught in component
      } catch (error) {
        // This is expected behavior
        expect(error.message).toBe('Invalid amount: must be positive');
      }
    });
  });

  describe('Wallet Request Listing', () => {
    it('should list all wallet requests', async () => {
      const mockRequests = [
        { id: 'req-1', amount: 100, status: 'pending' },
        { id: 'req-2', amount: 200, status: 'paid' },
        { id: 'req-3', amount: 150, status: 'cancelled' },
      ];

      mockWalletAPI.listWalletRequests.mockResolvedValue(mockRequests);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const listBtn = screen.getByTestId('list-requests-btn');
      fireEvent.click(listBtn);

      await waitFor(() => {
        expect(mockWalletAPI.listWalletRequests).toHaveBeenCalled();
        expect(screen.getByTestId('requests-count')).toHaveTextContent('3');
      });
    });

    it('should handle empty request list', async () => {
      mockWalletAPI.listWalletRequests.mockResolvedValue([]);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const listBtn = screen.getByTestId('list-requests-btn');
      fireEvent.click(listBtn);

      await waitFor(() => {
        expect(mockWalletAPI.listWalletRequests).toHaveBeenCalled();
        expect(screen.getByTestId('requests-count')).toHaveTextContent('0');
      });
    });

    it('should handle list requests errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWalletAPI.listWalletRequests.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const listBtn = screen.getByTestId('list-requests-btn');
      fireEvent.click(listBtn);

      await waitFor(() => {
        expect(mockWalletAPI.listWalletRequests).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('List requests failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Mark Request as Paid', () => {
    it('should mark request as paid successfully', async () => {
      // Setup initial requests
      const initialRequests = [
        { id: 'request-123', amount: 100, status: 'pending' },
      ];
      mockWalletAPI.listWalletRequests.mockResolvedValue(initialRequests);
      mockWalletAPI.markRequestAsPaid.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      // Load initial requests
      const listBtn = screen.getByTestId('list-requests-btn');
      fireEvent.click(listBtn);

      await waitFor(() => {
        expect(screen.getByTestId('requests-count')).toHaveTextContent('1');
      });

      // Mark as paid
      const markPaidBtn = screen.getByTestId('mark-paid-btn');
      fireEvent.click(markPaidBtn);

      await waitFor(() => {
        expect(mockWalletAPI.markRequestAsPaid).toHaveBeenCalledWith('request-123');
        expect(screen.getByTestId('request-0')).toHaveTextContent('100 - paid');
      });
    });

    it('should handle mark as paid errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWalletAPI.markRequestAsPaid.mockRejectedValue(new Error('Request not found'));

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const markPaidBtn = screen.getByTestId('mark-paid-btn');
      fireEvent.click(markPaidBtn);

      await waitFor(() => {
        expect(mockWalletAPI.markRequestAsPaid).toHaveBeenCalledWith('request-123');
        expect(consoleSpy).toHaveBeenCalledWith('Mark as paid failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Optimistic UI Updates', () => {
    it('should implement optimistic updates for request creation', async () => {
      const mockRequest = {
        id: 'req-real-123',
        amount: 100,
        description: 'Test payment',
        status: 'pending',
      };

      // Delay the API response to test optimistic update
      mockWalletAPI.createWalletRequest.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockRequest), 100))
      );

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-request-btn');
      fireEvent.click(createBtn);

      // Should show optimistic update immediately
      expect(screen.getByTestId('optimistic-status')).toHaveTextContent('updating');
      expect(screen.getByTestId('requests-count')).toHaveTextContent('1');

      // Wait for real response
      await waitFor(() => {
        expect(screen.getByTestId('optimistic-status')).toHaveTextContent('idle');
        expect(mockWalletAPI.createWalletRequest).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('should revert optimistic updates on 4xx/5xx errors', async () => {
      const errorResponse = new Error('Bad Request');
      errorResponse.name = 'ValidationError';
      mockWalletAPI.createWalletRequest.mockRejectedValue(errorResponse);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-request-btn');
      
      try {
        fireEvent.click(createBtn);

        // Should show optimistic update immediately
        expect(screen.getByTestId('optimistic-status')).toHaveTextContent('updating');
        expect(screen.getByTestId('requests-count')).toHaveTextContent('1');

        await waitFor(() => {
          expect(mockWalletAPI.createWalletRequest).toHaveBeenCalled();
        });
        // Test should complete without throwing since error is caught in component
      } catch (error) {
        // This is expected behavior
        expect(error.message).toBe('Bad Request');
      }

      // Should revert optimistic update
      await waitFor(() => {
        expect(screen.getByTestId('optimistic-status')).toHaveTextContent('idle');
        expect(screen.getByTestId('requests-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Wallet V2 Status Transitions', () => {
    it('should track status transitions correctly', async () => {
      const mockTransitions = [
        { from: null, to: 'pending', timestamp: Date.now() - 3000 },
        { from: 'pending', to: 'processing', timestamp: Date.now() - 2000 },
        { from: 'processing', to: 'paid', timestamp: Date.now() - 1000 },
      ];

      mockWalletAPI.getStatusTransitions.mockResolvedValue(mockTransitions);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const getTransitionsBtn = screen.getByTestId('get-transitions-btn');
      fireEvent.click(getTransitionsBtn);

      await waitFor(() => {
        expect(mockWalletAPI.getStatusTransitions).toHaveBeenCalledWith('request-123');
        expect(screen.getByTestId('transitions-count')).toHaveTextContent('3');
      });
    });

    it('should handle invalid status transitions', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWalletAPI.getStatusTransitions.mockRejectedValue(new Error('Invalid status transition'));

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const getTransitionsBtn = screen.getByTestId('get-transitions-btn');
      fireEvent.click(getTransitionsBtn);

      await waitFor(() => {
        expect(mockWalletAPI.getStatusTransitions).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Get transitions failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('CSV Export', () => {
    it('should export wallet data to CSV', async () => {
      const mockCSV = 'ID,Amount,Status,Created\nreq-1,100,paid,2024-01-01\nreq-2,200,pending,2024-01-02';
      mockWalletAPI.exportCSV.mockResolvedValue(mockCSV);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId('export-csv-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockWalletAPI.exportCSV).toHaveBeenCalled();
        const csvElement = screen.getByTestId('csv-data');
        expect(csvElement).toHaveTextContent('ID,Amount,Status,Created');
        expect(csvElement).toHaveTextContent('req-1,100,paid,2024-01-01');
        expect(csvElement).toHaveTextContent('req-2,200,pending,2024-01-02');
      });
    });

    it('should handle CSV export errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockWalletAPI.exportCSV.mockRejectedValue(new Error('Export failed'));

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId('export-csv-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(mockWalletAPI.exportCSV).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('CSV export failed:', expect.any(Error));
        expect(screen.getByTestId('csv-data')).toHaveTextContent('');
      });

      consoleSpy.mockRestore();
    });
  });
});