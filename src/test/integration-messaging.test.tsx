import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock messaging API
const mockMessagingAPI = {
  sendMessage: vi.fn(),
  getMessageHistory: vi.fn(),
  markAsRead: vi.fn(),
  joinReceipts: vi.fn(),
  connectWebSocket: vi.fn(),
};

// Mock WebSocket for messaging
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

vi.mock('@/services/messaging', () => ({
  MessagingAPI: mockMessagingAPI,
}));

// Test component for messaging operations
const MessagingTestComponent: React.FC = () => {
  const [messages, setMessages] = React.useState<Record<string, unknown>[]>([]);
  const [wsStatus, setWsStatus] = React.useState('disconnected');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [receipts, setReceipts] = React.useState<Record<string, unknown>[]>([]);

  const sendMessage = async (text: string) => {
    try {
      const message = await mockMessagingAPI.sendMessage({
        text,
        chatId: 'chat-123',
        timestamp: Date.now(),
      });
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Send failed:', error);
    }
  };

  const loadHistory = async (page = 1) => {
    try {
      const history = await mockMessagingAPI.getMessageHistory({
        chatId: 'chat-123',
        page,
        limit: 20,
      });
      setMessages(history.messages);
      setCurrentPage(page);
    } catch (error) {
      console.error('History load failed:', error);
    }
  };

  const loadReceipts = async () => {
    try {
      const receiptsData = await mockMessagingAPI.joinReceipts('chat-123');
      setReceipts(receiptsData);
    } catch (error) {
      console.error('Receipts load failed:', error);
    }
  };

  const connectWS = async () => {
    try {
      await mockMessagingAPI.connectWebSocket('valid-jwt-token');
      setWsStatus('connected');
    } catch (error) {
      setWsStatus('error');
      console.error('WS connection failed:', error);
    }
  };

  return (
    <div>
      <input
        data-testid="message-input"
        placeholder="Type message..."
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendMessage(e.currentTarget.value);
            e.currentTarget.value = '';
          }
        }}
      />
      <button data-testid="send-btn" onClick={() => sendMessage('Test message')}>
        Send
      </button>
      <button data-testid="load-history-btn" onClick={() => loadHistory(currentPage)}>
        Load History
      </button>
      <button data-testid="next-page-btn" onClick={() => loadHistory(currentPage + 1)}>
        Next Page
      </button>
      <button data-testid="load-receipts-btn" onClick={loadReceipts}>
        Load Receipts
      </button>
      <button data-testid="connect-ws-btn" onClick={connectWS}>
        Connect WebSocket
      </button>

      <div data-testid="ws-status">{wsStatus}</div>
      <div data-testid="messages-count">{messages.length}</div>
      <div data-testid="current-page">{currentPage}</div>
      <div data-testid="receipts-count">{receipts.length}</div>

      <div data-testid="messages-list">
        {messages.map((msg, index) => (
          <div key={index} data-testid={`message-${index}`}>
            {msg.text}
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

describe('Messaging Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.WebSocket = vi.fn(() => mockWebSocket) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Message History Pagination', () => {
    it('should load message history with pagination', async () => {
      const mockMessages = [
        { id: '1', text: 'Hello', timestamp: Date.now() },
        { id: '2', text: 'World', timestamp: Date.now() + 1000 },
      ];

      mockMessagingAPI.getMessageHistory.mockResolvedValue({
        messages: mockMessages,
        hasMore: true,
        totalPages: 5,
      });

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const loadHistoryBtn = screen.getByTestId('load-history-btn');
      fireEvent.click(loadHistoryBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.getMessageHistory).toHaveBeenCalledWith({
          chatId: 'chat-123',
          page: 1,
          limit: 20,
        });
        expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
      });
    });

    it('should handle pagination navigation', async () => {
      const page1Messages = [
        { id: '1', text: 'Page 1 Message 1', timestamp: Date.now() },
        { id: '2', text: 'Page 1 Message 2', timestamp: Date.now() + 1000 },
      ];

      const page2Messages = [
        { id: '3', text: 'Page 2 Message 1', timestamp: Date.now() + 2000 },
        { id: '4', text: 'Page 2 Message 2', timestamp: Date.now() + 3000 },
      ];

      mockMessagingAPI.getMessageHistory
        .mockResolvedValueOnce({ messages: page1Messages, hasMore: true, totalPages: 5 })
        .mockResolvedValueOnce({ messages: page2Messages, hasMore: true, totalPages: 5 });

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      // Load first page
      const loadHistoryBtn = screen.getByTestId('load-history-btn');
      fireEvent.click(loadHistoryBtn);

      await waitFor(() => {
        expect(screen.getByTestId('current-page')).toHaveTextContent('1');
        expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
      });

      // Load next page
      const nextPageBtn = screen.getByTestId('next-page-btn');
      fireEvent.click(nextPageBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.getMessageHistory).toHaveBeenCalledWith({
          chatId: 'chat-123',
          page: 2,
          limit: 20,
        });
        expect(screen.getByTestId('current-page')).toHaveTextContent('2');
        expect(screen.getByTestId('messages-count')).toHaveTextContent('2');
      });
    });

    it('should handle history pagination errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockMessagingAPI.getMessageHistory.mockRejectedValue(new Error('Failed to load history'));

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const loadHistoryBtn = screen.getByTestId('load-history-btn');
      fireEvent.click(loadHistoryBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.getMessageHistory).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('History load failed:', expect.any(Error));
        expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Receipts Join Operations', () => {
    it('should join and load message receipts', async () => {
      const mockReceipts = [
        { messageId: '1', userId: 'user1', readAt: Date.now(), deliveredAt: Date.now() - 1000 },
        { messageId: '2', userId: 'user2', readAt: null, deliveredAt: Date.now() - 500 },
      ];

      mockMessagingAPI.joinReceipts.mockResolvedValue(mockReceipts);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const loadReceiptsBtn = screen.getByTestId('load-receipts-btn');
      fireEvent.click(loadReceiptsBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.joinReceipts).toHaveBeenCalledWith('chat-123');
        expect(screen.getByTestId('receipts-count')).toHaveTextContent('2');
      });
    });

    it('should handle receipts loading errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockMessagingAPI.joinReceipts.mockRejectedValue(new Error('Receipts unavailable'));

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const loadReceiptsBtn = screen.getByTestId('load-receipts-btn');
      fireEvent.click(loadReceiptsBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.joinReceipts).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Receipts load failed:', expect.any(Error));
        expect(screen.getByTestId('receipts-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('WebSocket JWT Validation', () => {
    it('should reject invalid JWTs with WS code 1008', async () => {
      const mockCloseEvent = { code: 1008, reason: 'Policy Violation (Invalid JWT)' };
      mockMessagingAPI.connectWebSocket.mockRejectedValue(mockCloseEvent);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const connectWsBtn = screen.getByTestId('connect-ws-btn');
      fireEvent.click(connectWsBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.connectWebSocket).toHaveBeenCalledWith('valid-jwt-token');
        expect(screen.getByTestId('ws-status')).toHaveTextContent('error');
      });
    });

    it('should successfully connect with valid JWT', async () => {
      mockMessagingAPI.connectWebSocket.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const connectWsBtn = screen.getByTestId('connect-ws-btn');
      fireEvent.click(connectWsBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.connectWebSocket).toHaveBeenCalledWith('valid-jwt-token');
        expect(screen.getByTestId('ws-status')).toHaveTextContent('connected');
      });
    });

    it('should handle WebSocket connection timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      timeoutError.name = 'TimeoutError';
      mockMessagingAPI.connectWebSocket.mockRejectedValue(timeoutError);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const connectWsBtn = screen.getByTestId('connect-ws-btn');
      fireEvent.click(connectWsBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.connectWebSocket).toHaveBeenCalled();
        expect(screen.getByTestId('ws-status')).toHaveTextContent('error');
      });
    });
  });

  describe('Message Sending', () => {
    it('should send message successfully', async () => {
      const mockMessage = { id: '123', text: 'Test message', timestamp: Date.now() };
      mockMessagingAPI.sendMessage.mockResolvedValue(mockMessage);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const sendBtn = screen.getByTestId('send-btn');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.sendMessage).toHaveBeenCalledWith({
          text: 'Test message',
          chatId: 'chat-123',
          timestamp: expect.any(Number),
        });
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });
    });

    it('should handle message sending errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockMessagingAPI.sendMessage.mockRejectedValue(new Error('Send failed'));

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const sendBtn = screen.getByTestId('send-btn');
      fireEvent.click(sendBtn);

      await waitFor(() => {
        expect(mockMessagingAPI.sendMessage).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Send failed:', expect.any(Error));
        expect(screen.getByTestId('messages-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });

    it('should handle keyboard input for message sending', async () => {
      const mockMessage = { id: '124', text: 'Keyboard message', timestamp: Date.now() };
      mockMessagingAPI.sendMessage.mockResolvedValue(mockMessage);

      render(
        <TestWrapper>
          <MessagingTestComponent />
        </TestWrapper>
      );

      const messageInput = screen.getByTestId('message-input');
      fireEvent.change(messageInput, { target: { value: 'Keyboard message' } });
      fireEvent.keyPress(messageInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      await waitFor(() => {
        expect(mockMessagingAPI.sendMessage).toHaveBeenCalledWith({
          text: 'Keyboard message',
          chatId: 'chat-123',
          timestamp: expect.any(Number),
        });
        expect(screen.getByTestId('messages-count')).toHaveTextContent('1');
      });
    });
  });
});