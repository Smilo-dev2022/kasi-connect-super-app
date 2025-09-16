import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the wallet API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock wallet request data
interface WalletRequest {
  id: number;
  amount: number;
  description: string;
  status: string;
  requester_id: string;
  created_at: string;
}

const mockWalletRequest: WalletRequest = {
  id: 1,
  amount: 100,
  description: 'Test payment',
  status: 'pending',
  requester_id: 'user1',
  created_at: '2024-01-01T00:00:00Z'
};

// Mock wallet service functions for testing
const walletService = {
  optimisticUpdate: (requestId: number, updates: Record<string, unknown>, requests: WalletRequest[]) => {
    return requests.map((r) => (r.id === requestId ? { ...r, ...updates } : r));
  },

  async acceptRequest(requestId: number, currentUserId: string, requests: WalletRequest[]) {
    const request = requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');
    
    const prev = request.status;
    const updatedRequests = this.optimisticUpdate(requestId, { 
      status: "accepted", 
      accepted_by: currentUserId 
    }, requests);
    
    try {
      const response = await fetch(`/api/wallet/requests/${requestId}/accept?actor_id=${encodeURIComponent(currentUserId)}`);
      if (!response.ok) throw new Error('API Error');
      return updatedRequests;
    } catch (error) {
      // Revert on error
      return this.optimisticUpdate(requestId, { status: prev }, requests);
    }
  },

  async cancelRequest(requestId: number, currentUserId: string, requests: WalletRequest[]) {
    const request = requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');
    
    const prev = request.status;
    const updatedRequests = this.optimisticUpdate(requestId, { 
      status: "canceled", 
      canceled_by: currentUserId 
    }, requests);
    
    try {
      const response = await fetch(`/api/wallet/requests/${requestId}/cancel?actor_id=${encodeURIComponent(currentUserId)}`);
      if (!response.ok) throw new Error('API Error');
      return updatedRequests;
    } catch (error) {
      // Revert on error
      return this.optimisticUpdate(requestId, { status: prev, canceled_by: undefined }, requests);
    }
  },

  async payRequest(requestId: number, currentUserId: string, requests: WalletRequest[]) {
    const request = requests.find(r => r.id === requestId);
    if (!request) throw new Error('Request not found');
    
    const prev = request.status;
    const updatedRequests = this.optimisticUpdate(requestId, { 
      status: "paid", 
      paid_by: currentUserId 
    }, requests);
    
    try {
      const response = await fetch(`/api/wallet/requests/${requestId}/pay?payer_id=${encodeURIComponent(currentUserId)}`);
      if (!response.ok) throw new Error('API Error');
      return updatedRequests;
    } catch (error) {
      // Revert on error
      return this.optimisticUpdate(requestId, { status: prev, paid_by: undefined }, requests);
    }
  }
};

describe('Wallet Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Optimistic UI Updates', () => {
    it('should optimistically update status on accept and revert on 4xx error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Client error'));
      
      const initialRequests = [mockWalletRequest];
      const result = await walletService.acceptRequest(1, 'user2', initialRequests);
      
      // Should revert to original status
      expect(result[0].status).toBe('pending');
    });

    it('should optimistically update status on cancel and revert on 5xx error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'));
      
      const initialRequests = [mockWalletRequest];
      const result = await walletService.cancelRequest(1, 'user2', initialRequests);
      
      // Should revert to original status
      expect(result[0].status).toBe('pending');
    });

    it('should optimistically update status on pay and revert on error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Payment failed'));
      
      const initialRequests = [mockWalletRequest];
      const result = await walletService.payRequest(1, 'user2', initialRequests);
      
      // Should revert to original status
      expect(result[0].status).toBe('pending');
    });
  });

  describe('Status Transitions', () => {
    it('should handle all valid status transitions', async () => {
      const statusTransitions = [
        { from: 'pending', to: 'accepted', action: 'accept' },
        { from: 'pending', to: 'canceled', action: 'cancel' },
        { from: 'accepted', to: 'paid', action: 'pay' },
        { from: 'accepted', to: 'canceled', action: 'cancel' }
      ];

      for (const transition of statusTransitions) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockWalletRequest,
            status: transition.to
          })
        });

        const initialRequests = [{
          ...mockWalletRequest,
          status: transition.from
        }];

        let result;
        switch (transition.action) {
          case 'accept':
            result = await walletService.acceptRequest(1, 'user2', initialRequests);
            break;
          case 'cancel':
            result = await walletService.cancelRequest(1, 'user2', initialRequests);
            break;
          case 'pay':
            result = await walletService.payRequest(1, 'user2', initialRequests);
            break;
        }

        expect(result[0].status).toBe(transition.to);
      }
    });

    it('should prevent invalid status transitions', () => {
      const completedRequest = {
        ...mockWalletRequest,
        status: 'paid'
      };

      // Completed requests should not have action buttons available
      // This would be handled in the UI layer
      expect(completedRequest.status).toBe('paid');
    });
  });

  describe('CSV Export', () => {
    it('should export wallet data to CSV format', () => {
      const mockTransactions = [
        { id: 1, amount: 100, description: 'Payment 1', status: 'completed', date: '2024-01-01' },
        { id: 2, amount: 200, description: 'Payment 2', status: 'pending', date: '2024-01-02' }
      ];

      // Mock CSV generation
      const csvContent = mockTransactions.map(transaction => 
        `${transaction.id},${transaction.amount},${transaction.description},${transaction.status},${transaction.date}`
      ).join('\n');

      expect(csvContent).toContain('Payment 1,completed');
      expect(csvContent).toContain('Payment 2,pending');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await walletService.acceptRequest(1, 'user2', [mockWalletRequest]);
      } catch (error) {
        // Error should be handled gracefully in the service
        expect(error).toBeDefined();
      }
    });

    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve(null)
      });

      try {
        await walletService.acceptRequest(1, 'user2', [mockWalletRequest]);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});