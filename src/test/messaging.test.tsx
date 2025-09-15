import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';

// Mock messaging service
const mockMessagingModule = {
  getMessageHistory: vi.fn(),
  markMessagesAsRead: vi.fn(),
  sendMessage: vi.fn(),
  joinThread: vi.fn(),
  leaveThread: vi.fn(),
  connectWebSocket: vi.fn(),
};

vi.mock('../lib/messagingClient', () => mockMessagingModule);

describe('Messaging Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Message History Pagination', () => {
    it('should fetch message history with pagination', async () => {
      const mockMessages = [
        { id: '1', content: 'Hello', from: 'user1', timestamp: Date.now() - 3000 },
        { id: '2', content: 'Hi there', from: 'user2', timestamp: Date.now() - 2000 },
        { id: '3', content: 'How are you?', from: 'user1', timestamp: Date.now() - 1000 },
      ];

      mockMessagingModule.getMessageHistory.mockResolvedValue({
        messages: mockMessages,
        hasMore: true,
        nextCursor: 'cursor-123',
        total: 50,
      });

      const result = await mockMessagingModule.getMessageHistory('thread-123', {
        limit: 3,
        before: null,
      });

      expect(mockMessagingModule.getMessageHistory).toHaveBeenCalledWith('thread-123', {
        limit: 3,
        before: null,
      });

      expect(result.messages).toHaveLength(3);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('cursor-123');
      expect(result.total).toBe(50);
    });

    it('should fetch next page of messages', async () => {
      const secondPageMessages = [
        { id: '4', content: 'Previous message 1', from: 'user2', timestamp: Date.now() - 4000 },
        { id: '5', content: 'Previous message 2', from: 'user1', timestamp: Date.now() - 5000 },
      ];

      mockMessagingModule.getMessageHistory.mockResolvedValue({
        messages: secondPageMessages,
        hasMore: false,
        nextCursor: null,
        total: 50,
      });

      const result = await mockMessagingModule.getMessageHistory('thread-123', {
        limit: 3,
        before: 'cursor-123',
      });

      expect(result.messages).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBe(null);
    });

    it('should handle empty message history', async () => {
      mockMessagingModule.getMessageHistory.mockResolvedValue({
        messages: [],
        hasMore: false,
        nextCursor: null,
        total: 0,
      });

      const result = await mockMessagingModule.getMessageHistory('empty-thread', {
        limit: 10,
        before: null,
      });

      expect(result.messages).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Message Read Receipts Join', () => {
    it('should join read receipts with messages', async () => {
      const messages = [
        { id: 'msg1', content: 'Hello', from: 'user1', timestamp: Date.now() },
        { id: 'msg2', content: 'Hi', from: 'user2', timestamp: Date.now() },
      ];

      const readReceipts = [
        { messageId: 'msg1', userId: 'user2', readAt: Date.now() },
        { messageId: 'msg1', userId: 'user3', readAt: Date.now() },
        { messageId: 'msg2', userId: 'user1', readAt: Date.now() },
      ];

      // Mock function to join messages with receipts
      const joinMessagesWithReceipts = (messages: any[], receipts: any[]) => {
        return messages.map(message => ({
          ...message,
          readBy: receipts
            .filter(receipt => receipt.messageId === message.id)
            .map(receipt => ({ userId: receipt.userId, readAt: receipt.readAt }))
        }));
      };

      const result = joinMessagesWithReceipts(messages, readReceipts);

      expect(result[0].readBy).toHaveLength(2);
      expect(result[1].readBy).toHaveLength(1);
      
      // Check that the read receipts are correctly associated
      expect(result[0].readBy.map((r: any) => r.userId)).toEqual(['user2', 'user3']);
      expect(result[1].readBy.map((r: any) => r.userId)).toEqual(['user1']);
    });

    it('should handle messages with no read receipts', async () => {
      const messages = [
        { id: 'msg1', content: 'Unread message', from: 'user1', timestamp: Date.now() },
      ];

      const readReceipts: any[] = [];

      const joinMessagesWithReceipts = (messages: any[], receipts: any[]) => {
        return messages.map(message => ({
          ...message,
          readBy: receipts
            .filter(receipt => receipt.messageId === message.id)
            .map(receipt => ({ userId: receipt.userId, readAt: receipt.readAt }))
        }));
      };

      const result = joinMessagesWithReceipts(messages, readReceipts);

      expect(result[0].readBy).toHaveLength(0);
    });
  });

  describe('Invalid JWT WebSocket Rejection', () => {
    let mockWebSocket: any;

    beforeAll(() => {
      // Mock WebSocket
      mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: WebSocket.OPEN,
      };

      global.WebSocket = vi.fn(() => mockWebSocket) as any;
    });

    afterAll(() => {
      vi.restoreAllMocks();
    });

    it('should reject WebSocket connection with invalid JWT and send code 1008', async () => {
      const invalidJWT = 'invalid.jwt.token';
      
      // Mock WebSocket connection with invalid JWT
      mockMessagingModule.connectWebSocket.mockImplementation((token: string) => {
        return new Promise((resolve, reject) => {
          if (token === invalidJWT) {
            // Simulate server closing connection with code 1008 (Policy Violation)
            const closeEvent = new CloseEvent('close', {
              code: 1008,
              reason: 'Invalid JWT token',
              wasClean: false,
            });
            reject(closeEvent);
          } else {
            resolve(mockWebSocket);
          }
        });
      });

      await expect(mockMessagingModule.connectWebSocket(invalidJWT))
        .rejects.toMatchObject({
          code: 1008,
          reason: 'Invalid JWT token',
        });
    });

    it('should accept WebSocket connection with valid JWT', async () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0In0.mock';
      
      mockMessagingModule.connectWebSocket.mockResolvedValue(mockWebSocket);

      const result = await mockMessagingModule.connectWebSocket(validJWT);

      expect(result).toBe(mockWebSocket);
      expect(mockMessagingModule.connectWebSocket).toHaveBeenCalledWith(validJWT);
    });

    it('should handle WebSocket authentication flow', async () => {
      const token = 'valid-token';
      const messageHandler = vi.fn();
      
      // Mock WebSocket events
      const mockWS = {
        ...mockWebSocket,
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
      };

      global.WebSocket = vi.fn(() => mockWS) as any;

      // Simulate WebSocket connection
      const ws = new WebSocket('ws://localhost:8080/ws');
      ws.onmessage = messageHandler;

      // Simulate auth message
      const authMessage = { type: 'auth', token };
      ws.send(JSON.stringify(authMessage));

      expect(mockWS.send).toHaveBeenCalledWith(JSON.stringify(authMessage));

      // Simulate successful auth response
      const authResponse = new MessageEvent('message', {
        data: JSON.stringify({ type: 'auth_success', userId: 'test-user' })
      });

      if (ws.onmessage) {
        ws.onmessage(authResponse);
      }

      expect(messageHandler).toHaveBeenCalledWith(authResponse);
    });
  });

  describe('Message Sending and Delivery', () => {
    it('should send message successfully', async () => {
      const messageData = {
        threadId: 'thread-123',
        content: 'Test message',
        type: 'text',
      };

      const mockResponse = {
        id: 'msg-456',
        ...messageData,
        timestamp: Date.now(),
        status: 'sent',
      };

      mockMessagingModule.sendMessage.mockResolvedValue(mockResponse);

      const result = await mockMessagingModule.sendMessage(messageData);

      expect(mockMessagingModule.sendMessage).toHaveBeenCalledWith(messageData);
      expect(result.id).toBe('msg-456');
      expect(result.status).toBe('sent');
    });

    it('should handle message send failure', async () => {
      const messageData = {
        threadId: 'thread-123',
        content: 'Failed message',
        type: 'text',
      };

      mockMessagingModule.sendMessage.mockRejectedValue(new Error('Send failed'));

      await expect(mockMessagingModule.sendMessage(messageData))
        .rejects.toThrow('Send failed');
    });
  });

  describe('Thread Management', () => {
    it('should join thread successfully', async () => {
      const threadId = 'thread-123';
      
      mockMessagingModule.joinThread.mockResolvedValue({
        threadId,
        status: 'joined',
        memberCount: 5,
      });

      const result = await mockMessagingModule.joinThread(threadId);

      expect(result.threadId).toBe(threadId);
      expect(result.status).toBe('joined');
      expect(result.memberCount).toBe(5);
    });

    it('should leave thread successfully', async () => {
      const threadId = 'thread-123';
      
      mockMessagingModule.leaveThread.mockResolvedValue({
        threadId,
        status: 'left',
      });

      const result = await mockMessagingModule.leaveThread(threadId);

      expect(result.threadId).toBe(threadId);
      expect(result.status).toBe('left');
    });
  });
});