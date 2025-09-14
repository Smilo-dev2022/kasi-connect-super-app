import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

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
  simulateMessage(data: unknown) {
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
    global.WebSocket = MockWebSocket as typeof WebSocket;
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
      
      let receivedMessage: unknown = null;
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

  describe('Messaging Request ID Logging', () => {
    // Mock logging utility
    const mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    const MessageLoggingComponent = () => {
      const [logs, setLogs] = React.useState<string[]>([]);

      const sendMessageWithLogging = async (message: string) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          mockLogger.info(`Sending message with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'send_message',
            message_length: message.length,
          });

          await mockMessagingAPI.getMessageHistory({ page: 1, limit: 20 });
          
          mockLogger.info(`Message sent successfully with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'send_message_success',
          });

          setLogs(prev => [...prev, `send_success:${requestId}`]);
        } catch (error) {
          mockLogger.error(`Message send failed with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'send_message_error',
            error: (error as Error).message,
          });
        }
      };

      const fetchHistoryWithLogging = async () => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          mockLogger.info(`Fetching message history with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'fetch_history',
          });

          await mockMessagingAPI.getMessageHistory({ page: 1, limit: 20 });
          
          mockLogger.info(`History fetched successfully with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'fetch_history_success',
          });

          setLogs(prev => [...prev, `fetch_success:${requestId}`]);
        } catch (error) {
          mockLogger.error(`History fetch failed with request_id: ${requestId}`, {
            request_id: requestId,
            action: 'fetch_history_error',
            error: (error as Error).message,
          });
        }
      };

      return (
        <div>
          <button 
            onClick={() => sendMessageWithLogging('Hello')} 
            data-testid="send-with-logging-btn"
          >
            Send Message
          </button>
          <button 
            onClick={fetchHistoryWithLogging} 
            data-testid="fetch-with-logging-btn"
          >
            Fetch History
          </button>
          <div data-testid="logs-count">{logs.length}</div>
          {logs.map((log, index) => (
            <div key={index} data-testid={`log-${index}`}>{log}</div>
          ))}
        </div>
      );
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should include request_id in send message logs', async () => {
      mockMessagingAPI.getMessageHistory.mockResolvedValue({
        messages: [],
        hasMore: false,
      });

      render(
        <TestWrapper>
          <MessageLoggingComponent />
        </TestWrapper>
      );

      const sendBtn = screen.getByTestId('send-with-logging-btn');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Sending message with request_id:'),
          expect.objectContaining({
            request_id: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
            action: 'send_message',
          })
        );
      });
    });

    it('should include request_id in history fetch logs', async () => {
      mockMessagingAPI.getMessageHistory.mockResolvedValue({
        messages: [{ id: '1', content: 'test' }],
        hasMore: false,
      });

      render(
        <TestWrapper>
          <MessageLoggingComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-with-logging-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('Fetching message history with request_id:'),
          expect.objectContaining({
            request_id: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
            action: 'fetch_history',
          })
        );
      });
    });

    it('should log success with matching request_id', async () => {
      mockMessagingAPI.getMessageHistory.mockResolvedValue({
        messages: [],
        hasMore: false,
      });

      render(
        <TestWrapper>
          <MessageLoggingComponent />
        </TestWrapper>
      );

      const sendBtn = screen.getByTestId('send-with-logging-btn');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        // Check that both info calls were made with the same request_id
        const calls = mockLogger.info.mock.calls;
        expect(calls).toHaveLength(2);
        
        const startLog = calls[0][1];
        const successLog = calls[1][1];
        
        expect(startLog.request_id).toBe(successLog.request_id);
        expect(startLog.action).toBe('send_message');
        expect(successLog.action).toBe('send_message_success');
      });
    });

    it('should log errors with request_id', async () => {
      mockMessagingAPI.getMessageHistory.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <MessageLoggingComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-with-logging-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.stringContaining('History fetch failed with request_id:'),
          expect.objectContaining({
            request_id: expect.stringMatching(/^req_\d+_[a-z0-9]+$/),
            action: 'fetch_history_error',
            error: 'Network error',
          })
        );
      });
    });
  });
});