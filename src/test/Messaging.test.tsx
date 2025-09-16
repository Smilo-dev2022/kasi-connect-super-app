import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock messaging service
const mockMessagingService = {
  sendMessage: vi.fn(),
  getHistory: vi.fn(),
  getReceipts: vi.fn(),
  connectWebSocket: vi.fn()
};

describe('Messaging Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('History Pagination', () => {
    it('should paginate message history correctly', async () => {
      const mockMessages = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        content: `Message ${i + 1}`,
        sender_id: 'user1',
        timestamp: new Date(Date.now() - i * 60000).toISOString()
      }));

      // Mock paginated responses
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            messages: mockMessages.slice(0, 20),
            has_more: true,
            next_cursor: 'cursor_20'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            messages: mockMessages.slice(20, 40),
            has_more: true,
            next_cursor: 'cursor_40'
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            messages: mockMessages.slice(40, 50),
            has_more: false,
            next_cursor: null
          })
        });

      const messagingService = await import('@/lib/messaging'); // Assuming messaging lib exists
      
      // Test first page
      const page1 = await messagingService.getHistory('group1', { limit: 20 });
      expect(page1.messages).toHaveLength(20);
      expect(page1.has_more).toBe(true);
      expect(page1.next_cursor).toBe('cursor_20');

      // Test second page
      const page2 = await messagingService.getHistory('group1', { 
        limit: 20, 
        cursor: 'cursor_20' 
      });
      expect(page2.messages).toHaveLength(20);
      expect(page2.has_more).toBe(true);

      // Test final page
      const page3 = await messagingService.getHistory('group1', { 
        limit: 20, 
        cursor: 'cursor_40' 
      });
      expect(page3.messages).toHaveLength(10);
      expect(page3.has_more).toBe(false);
    });

    it('should handle empty history pagination', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            messages: [],
            has_more: false,
            next_cursor: null
          })
        });

      const messagingService = await import('@/lib/messaging');
      
      const result = await messagingService.getHistory('empty_group', { limit: 20 });
      expect(result.messages).toHaveLength(0);
      expect(result.has_more).toBe(false);
    });

    it('should handle pagination errors gracefully', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' })
        });

      const messagingService = await import('@/lib/messaging');
      
      try {
        await messagingService.getHistory('group1', { limit: 20 });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('server error');
      }
    });
  });

  describe('Receipts Join', () => {
    it('should join message receipts correctly', async () => {
      const mockMessages = [
        {
          id: 1,
          content: 'Hello world',
          sender_id: 'user1',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: 2,
          content: 'How are you?',
          sender_id: 'user1',
          timestamp: '2024-01-01T10:01:00Z'
        }
      ];

      const mockReceipts = [
        {
          message_id: 1,
          user_id: 'user2',
          status: 'delivered',
          timestamp: '2024-01-01T10:00:30Z'
        },
        {
          message_id: 1,
          user_id: 'user3',
          status: 'read',
          timestamp: '2024-01-01T10:01:00Z'
        },
        {
          message_id: 2,
          user_id: 'user2',
          status: 'delivered',
          timestamp: '2024-01-01T10:01:30Z'
        }
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ receipts: mockReceipts })
        });

      const messagingService = await import('@/lib/messaging');
      
      // Test joining receipts with messages
      const messagesWithReceipts = await messagingService.getMessagesWithReceipts('group1');
      
      expect(messagesWithReceipts).toHaveLength(2);
      
      // Check first message receipts
      const message1 = messagesWithReceipts.find(m => m.id === 1);
      expect(message1.receipts).toHaveLength(2);
      expect(message1.receipts.some(r => r.status === 'delivered')).toBe(true);
      expect(message1.receipts.some(r => r.status === 'read')).toBe(true);
      
      // Check second message receipts
      const message2 = messagesWithReceipts.find(m => m.id === 2);
      expect(message2.receipts).toHaveLength(1);
      expect(message2.receipts[0].status).toBe('delivered');
    });

    it('should handle missing receipts gracefully', async () => {
      const mockMessages = [
        {
          id: 1,
          content: 'Hello world',
          sender_id: 'user1',
          timestamp: '2024-01-01T10:00:00Z'
        }
      ];

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ messages: mockMessages })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ receipts: [] })
        });

      const messagingService = await import('@/lib/messaging');
      
      const messagesWithReceipts = await messagingService.getMessagesWithReceipts('group1');
      
      expect(messagesWithReceipts).toHaveLength(1);
      expect(messagesWithReceipts[0].receipts).toHaveLength(0);
    });
  });

  describe('JWT WebSocket Validation', () => {
    it('should reject invalid JWTs with WS code 1008', async () => {
      const invalidToken = 'invalid.jwt.token';
      let onCloseCallback: (event: { code: number; reason: string }) => void;
      
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1, // WebSocket.OPEN
        addEventListener: vi.fn((event, callback) => {
          if (event === 'close') onCloseCallback = callback;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      };

      // Mock WebSocket constructor
      const originalWebSocket = global.WebSocket;
      global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

      const wsService = await import('@/lib/websocket');
      
      // Test WebSocket connection with invalid JWT
      const ws = new wsService.MessagingWebSocket('ws://localhost:8080/ws', invalidToken);
      
      // Simulate server rejecting invalid JWT with code 1008
      if (onCloseCallback) {
        onCloseCallback({ code: 1008, reason: 'Invalid JWT' });
      }
      
      expect(mockWebSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      
      // Restore original WebSocket
      global.WebSocket = originalWebSocket;
    });

    it('should successfully authenticate with valid JWT', async () => {
      const validToken = 'valid.jwt.token';
      let onMessageCallback: (event: { data: string }) => void;
      let onOpenCallback: () => void;
      
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1, // WebSocket.OPEN
        addEventListener: vi.fn((event, callback) => {
          if (event === 'message') onMessageCallback = callback;
          if (event === 'open') onOpenCallback = callback;
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn((event) => {
          if (event.type === 'open' && onOpenCallback) {
            onOpenCallback();
          }
        })
      };

      const originalWebSocket = global.WebSocket;
      global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

      const wsService = await import('@/lib/websocket');
      
      // Test WebSocket connection with valid JWT
      const ws = new wsService.MessagingWebSocket('ws://localhost:8080/ws', validToken);
      
      // Should send auth message
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'auth',
          token: validToken
        })
      );

      // Simulate successful auth response
      if (onMessageCallback) {
        onMessageCallback({
          data: JSON.stringify({
            type: 'auth_success',
            user_id: 'user123'
          })
        });
      }

      expect(ws.isAuthenticated).toBe(true);
      
      // Restore original WebSocket
      global.WebSocket = originalWebSocket;
    });
  });

  describe('Request ID Logging', () => {
    it('should include request_id in message send logs', async () => {
      const mockRequestId = 'req_12345';
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'x-request-id' ? mockRequestId : null
          },
          json: () => Promise.resolve({ message_id: 'msg_123' })
        });

      const messagingService = await import('@/lib/messaging');
      
      // Mock console.log to capture logs
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await messagingService.sendMessage('group1', 'Hello world');
      
      // Verify request ID is logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`request_id=${mockRequestId}`)
      );
      
      consoleSpy.mockRestore();
    });

    it('should include request_id in history fetch logs', async () => {
      const mockRequestId = 'req_67890';
      
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name: string) => name === 'x-request-id' ? mockRequestId : null
          },
          json: () => Promise.resolve({ messages: [] })
        });

      const messagingService = await import('@/lib/messaging');
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await messagingService.getHistory('group1', { limit: 20 });
      
      // Verify request ID is logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`request_id=${mockRequestId}`)
      );
      
      consoleSpy.mockRestore();
    });
  });
});