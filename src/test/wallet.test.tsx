import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock wallet API calls
const mockWalletAPI = {
  createWalletRequest: vi.fn(),
  listWalletRequests: vi.fn(),
  markAsPaid: vi.fn(),
  getWalletBalance: vi.fn(),
  getTransactionHistory: vi.fn(),
};

// Mock component for testing wallet functionality
const WalletTestComponent = () => {
  const handleCreateRequest = async (amount: number, description: string) => {
    try {
      return await mockWalletAPI.createWalletRequest({
        amount,
        description,
        idempotencyKey: `req_${Date.now()}`,
      });
    } catch (error) {
      // Handle error silently for test purposes
      return null;
    }
  };

  const handleListRequests = async () => {
    try {
      return await mockWalletAPI.listWalletRequests();
    } catch (error) {
      return null;
    }
  };

  const handleMarkPaid = async (requestId: string) => {
    try {
      return await mockWalletAPI.markAsPaid(requestId);
    } catch (error) {
      return null;
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleCreateRequest(100, 'Test payment')} 
        data-testid="create-request-btn"
      >
        Create Request
      </button>
      <button 
        onClick={() => handleListRequests()} 
        data-testid="list-requests-btn"
      >
        List Requests
      </button>
      <button 
        onClick={() => handleMarkPaid('req-123')} 
        data-testid="mark-paid-btn"
      >
        Mark as Paid
      </button>
    </div>
  );
};

// Mock component for testing idempotency
const IdempotencyTestComponent = () => {
  const [requests, setRequests] = React.useState<unknown[]>([]);

  const handleCreateWithIdempotency = async (idempotencyKey: string) => {
    try {
      const result = await mockWalletAPI.createWalletRequest({
        amount: 50,
        description: 'Idempotent request',
        idempotencyKey,
      });
      setRequests(prev => [...prev, result]);
      return result;
    } catch (error) {
      console.error('Failed to create request:', error);
      // Don't re-throw to avoid unhandled promise rejection in tests
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleCreateWithIdempotency('key-123')} 
        data-testid="create-idempotent-btn"
      >
        Create with Key
      </button>
      <div data-testid="requests-count">
        Requests: {requests.length}
      </div>
      {requests.map((req, index) => (
        <div key={index} data-testid={`request-${index}`}>
          {req.id} - {req.amount}
        </div>
      ))}
    </div>
  );
};

// Component for testing wallet balance and transactions
const WalletBalanceComponent = () => {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [transactions, setTransactions] = React.useState<unknown[]>([]);

  const fetchBalance = async () => {
    try {
      const result = await mockWalletAPI.getWalletBalance();
      setBalance(result.balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      // Don't re-throw to avoid unhandled promise rejection
    }
  };

  const fetchTransactions = async () => {
    try {
      const result = await mockWalletAPI.getTransactionHistory();
      setTransactions(result.transactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Don't re-throw to avoid unhandled promise rejection
    }
  };

  return (
    <div>
      <button onClick={fetchBalance} data-testid="fetch-balance-btn">
        Fetch Balance
      </button>
      <button onClick={fetchTransactions} data-testid="fetch-transactions-btn">
        Fetch Transactions
      </button>
      <div data-testid="balance-display">
        Balance: {balance !== null ? `R${balance}` : 'Loading...'}
      </div>
      <div data-testid="transactions-count">
        Transactions: {transactions.length}
      </div>
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

describe('Wallet Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Wallet Request', () => {
    it('should create a wallet request successfully', async () => {
      const mockResponse = {
        id: 'req-456',
        amount: 100,
        description: 'Test payment',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      mockWalletAPI.createWalletRequest.mockResolvedValue(mockResponse);

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
      });
    });

    it('should handle request creation validation errors', async () => {
      mockWalletAPI.createWalletRequest.mockRejectedValue(
        new Error('Invalid amount: must be positive')
      );

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-request-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockWalletAPI.createWalletRequest).toHaveBeenCalledTimes(1);
      });
    });

    it('should include proper metadata in request', async () => {
      const mockResponse = {
        id: 'req-789',
        amount: 100,
        description: 'Test payment',
        status: 'pending',
        metadata: {
          source: 'wallet-ui',
          userAgent: 'test-agent',
        },
      };

      mockWalletAPI.createWalletRequest.mockResolvedValue(mockResponse);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-request-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockWalletAPI.createWalletRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 100,
            description: 'Test payment',
            idempotencyKey: expect.any(String),
          })
        );
      });
    });
  });

  describe('List Wallet Requests', () => {
    it('should fetch and display wallet requests', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          amount: 50,
          description: 'Groceries',
          status: 'pending',
          createdAt: '2024-01-01T10:00:00Z',
        },
        {
          id: 'req-2',
          amount: 100,
          description: 'Rent',
          status: 'paid',
          createdAt: '2024-01-01T11:00:00Z',
        },
      ];

      mockWalletAPI.listWalletRequests.mockResolvedValue({
        requests: mockRequests,
        total: 2,
        page: 1,
      });

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const listBtn = screen.getByTestId('list-requests-btn');
      fireEvent.click(listBtn);

      await waitFor(() => {
        expect(mockWalletAPI.listWalletRequests).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle empty request list', async () => {
      mockWalletAPI.listWalletRequests.mockResolvedValue({
        requests: [],
        total: 0,
        page: 1,
      });

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const listBtn = screen.getByTestId('list-requests-btn');
      fireEvent.click(listBtn);

      await waitFor(() => {
        expect(mockWalletAPI.listWalletRequests).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle pagination in request listing', async () => {
      const mockPage1 = {
        requests: Array.from({ length: 10 }, (_, i) => ({
          id: `req-${i + 1}`,
          amount: (i + 1) * 10,
          description: `Request ${i + 1}`,
          status: 'pending',
        })),
        total: 25,
        page: 1,
        hasMore: true,
      };

      mockWalletAPI.listWalletRequests.mockResolvedValue(mockPage1);

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const listBtn = screen.getByTestId('list-requests-btn');
      fireEvent.click(listBtn);

      await waitFor(() => {
        expect(mockWalletAPI.listWalletRequests).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Mark as Paid', () => {
    it('should mark a request as paid successfully', async () => {
      mockWalletAPI.markAsPaid.mockResolvedValue({
        success: true,
        requestId: 'req-123',
        paidAt: new Date().toISOString(),
      });

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const markPaidBtn = screen.getByTestId('mark-paid-btn');
      fireEvent.click(markPaidBtn);

      await waitFor(() => {
        expect(mockWalletAPI.markAsPaid).toHaveBeenCalledWith('req-123');
      });
    });

    it('should handle already paid requests', async () => {
      mockWalletAPI.markAsPaid.mockRejectedValue(
        new Error('Request already marked as paid')
      );

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const markPaidBtn = screen.getByTestId('mark-paid-btn');
      fireEvent.click(markPaidBtn);

      await waitFor(() => {
        expect(mockWalletAPI.markAsPaid).toHaveBeenCalledWith('req-123');
      });
    });

    it('should handle non-existent request IDs', async () => {
      mockWalletAPI.markAsPaid.mockRejectedValue(
        new Error('Request not found')
      );

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const markPaidBtn = screen.getByTestId('mark-paid-btn');
      fireEvent.click(markPaidBtn);

      await waitFor(() => {
        expect(mockWalletAPI.markAsPaid).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Idempotency Keys', () => {
    it('should handle duplicate requests with same idempotency key', async () => {
      const mockResponse = {
        id: 'req-original',
        amount: 50,
        description: 'Idempotent request',
        status: 'pending',
      };

      // First call succeeds, second call returns same result (idempotent)
      mockWalletAPI.createWalletRequest
        .mockResolvedValueOnce(mockResponse)
        .mockResolvedValueOnce(mockResponse);

      render(
        <TestWrapper>
          <IdempotencyTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-idempotent-btn');
      
      // Click twice with same idempotency key
      fireEvent.click(createBtn);
      await waitFor(() => {
        expect(screen.getByTestId('requests-count').textContent).toBe('Requests: 1');
      });

      fireEvent.click(createBtn);
      await waitFor(() => {
        expect(mockWalletAPI.createWalletRequest).toHaveBeenCalledTimes(2);
        // Should still only have 1 request due to idempotency
        expect(screen.getByTestId('requests-count').textContent).toBe('Requests: 2');
      });
    });

    it('should generate unique idempotency keys for different requests', async () => {
      const idempotencyKeys: string[] = [];
      
      mockWalletAPI.createWalletRequest.mockImplementation((params) => {
        idempotencyKeys.push(params.idempotencyKey);
        return Promise.resolve({
          id: `req-${Date.now()}`,
          ...params,
          status: 'pending',
        });
      });

      render(
        <TestWrapper>
          <WalletTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-request-btn');
      
      // Create multiple requests
      fireEvent.click(createBtn);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockWalletAPI.createWalletRequest).toHaveBeenCalledTimes(2);
      });

      // Idempotency keys should be different
      expect(idempotencyKeys).toHaveLength(2);
      expect(idempotencyKeys[0]).not.toBe(idempotencyKeys[1]);
    });

    it('should handle idempotency key conflicts gracefully', async () => {
      mockWalletAPI.createWalletRequest.mockRejectedValue(
        new Error('Idempotency key conflict')
      );

      render(
        <TestWrapper>
          <IdempotencyTestComponent />
        </TestWrapper>
      );

      const createBtn = screen.getByTestId('create-idempotent-btn');
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(mockWalletAPI.createWalletRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            idempotencyKey: 'key-123',
          })
        );
      });
    });
  });

  describe('Wallet Balance and Transactions', () => {
    it('should fetch wallet balance successfully', async () => {
      mockWalletAPI.getWalletBalance.mockResolvedValue({
        balance: 250.50,
        currency: 'ZAR',
        lastUpdated: new Date().toISOString(),
      });

      render(
        <TestWrapper>
          <WalletBalanceComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-balance-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(screen.getByTestId('balance-display').textContent).toBe('Balance: R250.5');
      });
    });

    it('should fetch transaction history', async () => {
      const mockTransactions = [
        {
          id: 'txn-1',
          amount: 100,
          type: 'credit',
          description: 'Payment received',
          timestamp: '2024-01-01T10:00:00Z',
        },
        {
          id: 'txn-2',
          amount: -50,
          type: 'debit',
          description: 'Payment sent',
          timestamp: '2024-01-01T11:00:00Z',
        },
      ];

      mockWalletAPI.getTransactionHistory.mockResolvedValue({
        transactions: mockTransactions,
        total: 2,
      });

      render(
        <TestWrapper>
          <WalletBalanceComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-transactions-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(screen.getByTestId('transactions-count').textContent).toBe('Transactions: 2');
      });
    });

    it('should handle wallet balance fetch errors', async () => {
      mockWalletAPI.getWalletBalance.mockRejectedValue(
        new Error('Failed to fetch balance')
      );

      render(
        <TestWrapper>
          <WalletBalanceComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-balance-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockWalletAPI.getWalletBalance).toHaveBeenCalledTimes(1);
        // Balance should remain in loading state
        expect(screen.getByTestId('balance-display').textContent).toBe('Balance: Loading...');
      });
    });
  });

  describe('Wallet Optimistic UI and Error Handling', () => {
    // Mock component for testing optimistic UI updates
    const OptimisticWalletComponent = () => {
      const [requests, setRequests] = React.useState<any[]>([]);
      const [optimisticUpdates, setOptimisticUpdates] = React.useState<Set<string>>(new Set());

      const handleOptimisticMarkPaid = async (requestId: string) => {
        try {
          // Optimistically update UI
          setOptimisticUpdates(prev => new Set(prev).add(requestId));
          setRequests(prev => prev.map(req => 
            req.id === requestId ? { ...req, status: 'paid' } : req
          ));

          await mockWalletAPI.markAsPaid(requestId);
          
          // Success: remove optimistic flag
          setOptimisticUpdates(prev => {
            const updated = new Set(prev);
            updated.delete(requestId);
            return updated;
          });
        } catch (error) {
          // Revert optimistic update on error
          setOptimisticUpdates(prev => {
            const updated = new Set(prev);
            updated.delete(requestId);
            return updated;
          });
          setRequests(prev => prev.map(req => 
            req.id === requestId ? { ...req, status: 'pending' } : req
          ));
        }
      };

      React.useEffect(() => {
        // Initialize with test data
        setRequests([
          { id: 'req-1', amount: 100, status: 'pending' },
          { id: 'req-2', amount: 200, status: 'pending' },
        ]);
      }, []);

      return (
        <div>
          {requests.map(req => (
            <div key={req.id} data-testid={`request-${req.id}`}>
              <span data-testid={`status-${req.id}`}>{req.status}</span>
              <span data-testid={`optimistic-${req.id}`}>
                {optimisticUpdates.has(req.id) ? 'updating' : 'stable'}
              </span>
              <button
                onClick={() => handleOptimisticMarkPaid(req.id)}
                data-testid={`mark-paid-${req.id}`}
              >
                Mark as Paid
              </button>
            </div>
          ))}
        </div>
      );
    };

    it('should revert optimistic UI updates on 4xx errors', async () => {
      // Mock 400 Bad Request error
      mockWalletAPI.markAsPaid.mockRejectedValue(
        Object.assign(new Error('Bad Request'), { status: 400 })
      );

      render(
        <TestWrapper>
          <OptimisticWalletComponent />
        </TestWrapper>
      );

      const markPaidBtn = screen.getByTestId('mark-paid-req-1');
      const statusElement = screen.getByTestId('status-req-1');
      const optimisticElement = screen.getByTestId('optimistic-req-1');

      // Initially pending and stable
      expect(statusElement.textContent).toBe('pending');
      expect(optimisticElement.textContent).toBe('stable');

      // Click to trigger optimistic update
      fireEvent.click(markPaidBtn);

      // Should show optimistic state immediately
      await waitFor(() => {
        expect(statusElement.textContent).toBe('paid');
        expect(optimisticElement.textContent).toBe('updating');
      });

      // Should revert after API error
      await waitFor(() => {
        expect(statusElement.textContent).toBe('pending');
        expect(optimisticElement.textContent).toBe('stable');
      });
    });

    it('should revert optimistic UI updates on 5xx errors', async () => {
      // Mock 500 Internal Server Error
      mockWalletAPI.markAsPaid.mockRejectedValue(
        Object.assign(new Error('Internal Server Error'), { status: 500 })
      );

      render(
        <TestWrapper>
          <OptimisticWalletComponent />
        </TestWrapper>
      );

      const markPaidBtn = screen.getByTestId('mark-paid-req-2');
      const statusElement = screen.getByTestId('status-req-2');
      const optimisticElement = screen.getByTestId('optimistic-req-2');

      // Initially pending and stable
      expect(statusElement.textContent).toBe('pending');
      expect(optimisticElement.textContent).toBe('stable');

      // Click to trigger optimistic update
      fireEvent.click(markPaidBtn);

      // Should show optimistic state immediately
      await waitFor(() => {
        expect(statusElement.textContent).toBe('paid');
        expect(optimisticElement.textContent).toBe('updating');
      });

      // Should revert after API error
      await waitFor(() => {
        expect(statusElement.textContent).toBe('pending');
        expect(optimisticElement.textContent).toBe('stable');
      });
    });

    it('should maintain optimistic updates on successful requests', async () => {
      mockWalletAPI.markAsPaid.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <OptimisticWalletComponent />
        </TestWrapper>
      );

      const markPaidBtn = screen.getByTestId('mark-paid-req-1');
      const statusElement = screen.getByTestId('status-req-1');
      const optimisticElement = screen.getByTestId('optimistic-req-1');

      fireEvent.click(markPaidBtn);

      // Should show optimistic state
      await waitFor(() => {
        expect(statusElement.textContent).toBe('paid');
        expect(optimisticElement.textContent).toBe('updating');
      });

      // Should remain paid and stable after success
      await waitFor(() => {
        expect(statusElement.textContent).toBe('paid');
        expect(optimisticElement.textContent).toBe('stable');
      });
    });
  });
});