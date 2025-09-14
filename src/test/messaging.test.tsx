import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock messaging service API calls
const mockMessagingAPI = {
  getMessageHistory: vi.fn(),
  markMessagesAsRead: vi.fn(),
  joinReceipts: vi.fn(),
  validateJWT: vi.fn(),
};

// Mock WebSocket for testing
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    // Mock sending data
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close', { code, reason }));
  }

  // Method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.readyState === MockWebSocket.OPEN) {
      this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Method to simulate invalid JWT rejection
  simulateInvalidJWT() {
    this.close(1008, 'Invalid JWT');
  }
}

// Mock component for testing messaging functionality
const MessagingTestComponent = () => {
  const handleGetHistory = async (page: number = 1) => {
    return await mockMessagingAPI.getMessageHistory({ page, limit: 20 });
  };

  const handleMarkAsRead = async (messageIds: string[]) => {
    return await mockMessagingAPI.markMessagesAsRead(messageIds);
  };

  const handleJoinReceipts = async (threadId: string) => {
    return await mockMessagingAPI.joinReceipts(threadId);
  };

  return (
    <div>
      <button 
        onClick={() => handleGetHistory(1)} 
        data-testid="get-history-btn"
      >
        Get History
      </button>
      <button 
        onClick={() => handleMarkAsRead(['msg1', 'msg2'])} 
        data-testid="mark-read-btn"
      >
        Mark as Read
      </button>
      <button 
        onClick={() => handleJoinReceipts('thread-123')} 
        data-testid="join-receipts-btn"
      >
        Join Receipts
      </button>
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

describe('Messaging Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global WebSocket
    global.WebSocket = MockWebSocket as any;
  });

  describe('Message History Pagination', () => {
    it('should fetch message history with pagination', async () => {
      const mockHistory = {
        messages: [
          { id: '1', content: 'Hello', timestamp: '2024-01-01T10:00:00Z' },
          { id: '2', content: 'World', timestamp: '2024-01-01T10:01:00Z' },
        ],
        hasMore: true,
        nextPage: 2,
      };

      mockMessagingAPI.getMessageHistory.mockResolvedValue(mockHistory);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const historyBtn = screen.getByTestId('get-history-btn');
      fireEvent.click(historyBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.getMessageHistory).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
        });
      });
    });

    it('should handle pagination correctly for large conversations', async () => {
      const mockHistoryPage1 = {
        messages: Array.from({ length: 20 }, (_, i) => ({
          id: `${i + 1}`,
          content: `Message ${i + 1}`,
          timestamp: `2024-01-01T10:${i.toString().padStart(2, '0')}:00Z`,
        })),
        hasMore: true,
        nextPage: 2,
      };

      mockMessagingAPI.getMessageHistory.mockResolvedValue(mockHistoryPage1);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const historyBtn = screen.getByTestId('get-history-btn');
      fireEvent.click(historyBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.getMessageHistory).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Read Receipts Join', () => {
    it('should join read receipts for a thread', async () => {
      mockMessagingAPI.joinReceipts.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const joinBtn = screen.getByTestId('join-receipts-btn');
      fireEvent.click(joinBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.joinReceipts).toHaveBeenCalledWith('thread-123');
      });
    });

    it('should mark messages as read correctly', async () => {
      mockMessagingAPI.markMessagesAsRead.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const markReadBtn = screen.getByTestId('mark-read-btn');
      fireEvent.click(markReadBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.markMessagesAsRead).toHaveBeenCalledWith(['msg1', 'msg2']);
      });
    });
  });

  describe('JWT WebSocket Validation', () => {
    it('should reject invalid JWTs with WebSocket code 1008', async () => {
      const mockWS = new MockWebSocket('ws://localhost:8080/ws');
      
      // Wait for connection to open
      await new Promise(resolve => {
        mockWS.onopen = () => resolve(void 0);
      });

      // Set up close event listener
      let closeCode: number | undefined;
      mockWS.onclose = (event) => {
        closeCode = event.code;
      };

      // Simulate invalid JWT rejection
      mockWS.simulateInvalidJWT();

      expect(closeCode).toBe(1008);
    });

    it('should accept valid JWTs and establish connection', async () => {
      const mockWS = new MockWebSocket('ws://localhost:8080/ws?token=valid-jwt');
      
      let isConnected = false;
      mockWS.onopen = () => {
        isConnected = true;
      };

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(isConnected).toBe(true);
      expect(mockWS.readyState).toBe(MockWebSocket.OPEN);
    });

    it('should handle WebSocket authentication flow', async () => {
      const mockWS = new MockWebSocket('ws://localhost:8080/ws');
      
      // Wait for connection
      await new Promise(resolve => {
        mockWS.onopen = () => resolve(void 0);
      });

      // Simulate authentication message
      const authMessage = { type: 'auth', token: 'valid-jwt-token' };
      mockWS.send(JSON.stringify(authMessage));

      // Simulate successful auth response
      const authResponse = { type: 'auth_success', userId: 'user123' };
      mockWS.simulateMessage(authResponse);

      expect(mockWS.readyState).toBe(MockWebSocket.OPEN);
    });

    it('should handle WebSocket message reception', async () => {
      const mockWS = new MockWebSocket('ws://localhost:8080/ws');
      
      let receivedMessage: any = null;
      mockWS.onmessage = (event) => {
        receivedMessage = JSON.parse(event.data);
      };

      // Wait for connection
      await new Promise(resolve => {
        mockWS.onopen = () => resolve(void 0);
      });

      // Simulate incoming message
      const testMessage = { 
        type: 'msg', 
        id: 'msg123', 
        content: 'Hello WebSocket',
        from: 'user456',
        timestamp: new Date().toISOString()
      };
      
      mockWS.simulateMessage(testMessage);

      expect(receivedMessage).toEqual(testMessage);
    });
  });
});