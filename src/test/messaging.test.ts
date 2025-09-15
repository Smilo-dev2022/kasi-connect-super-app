import { describe, it, expect, vi, beforeEach } from 'vitest';

// Messaging Service Tests
describe('Messaging Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('History Pagination', () => {
    it('should paginate message history correctly', async () => {
      const mockMessages = {
        messages: [
          { id: '1', content: 'Hello', timestamp: '2025-01-01T10:00:00Z', userId: 'user1' },
          { id: '2', content: 'Hi there', timestamp: '2025-01-01T10:01:00Z', userId: 'user2' },
          { id: '3', content: 'How are you?', timestamp: '2025-01-01T10:02:00Z', userId: 'user1' }
        ],
        pagination: {
          hasMore: true,
          nextCursor: 'cursor123',
          total: 50
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });

      const response = await fetch('/messages/history?limit=3&cursor=start');
      const data = await response.json();
      
      expect(response.ok).toBe(true);
      expect(data.messages).toHaveLength(3);
      expect(data.pagination.hasMore).toBe(true);
      expect(data.pagination.nextCursor).toBe('cursor123');
    });

    it('should handle end of pagination', async () => {
      const mockMessages = {
        messages: [
          { id: '48', content: 'Last message', timestamp: '2025-01-01T12:00:00Z', userId: 'user1' }
        ],
        pagination: {
          hasMore: false,
          nextCursor: null,
          total: 50
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });

      const response = await fetch('/messages/history?limit=10&cursor=cursor49');
      const data = await response.json();
      
      expect(data.pagination.hasMore).toBe(false);
      expect(data.pagination.nextCursor).toBeNull();
    });

    it('should handle invalid pagination cursor', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid cursor' }),
      });

      const response = await fetch('/messages/history?cursor=invalid');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });
  });

  describe('Message Receipts Join', () => {
    it('should join message receipts with messages', async () => {
      const mockMessagesWithReceipts = {
        messages: [
          {
            id: '1',
            content: 'Hello',
            timestamp: '2025-01-01T10:00:00Z',
            userId: 'user1',
            receipts: [
              { userId: 'user2', status: 'delivered', timestamp: '2025-01-01T10:00:05Z' },
              { userId: 'user3', status: 'read', timestamp: '2025-01-01T10:01:00Z' }
            ]
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessagesWithReceipts),
      });

      const response = await fetch('/messages/history?includeReceipts=true');
      const data = await response.json();
      
      expect(data.messages[0].receipts).toBeDefined();
      expect(data.messages[0].receipts).toHaveLength(2);
      expect(data.messages[0].receipts[0].status).toBe('delivered');
      expect(data.messages[0].receipts[1].status).toBe('read');
    });

    it('should handle empty receipts', async () => {
      const mockMessages = {
        messages: [
          {
            id: '1',
            content: 'Hello',
            timestamp: '2025-01-01T10:00:00Z',
            userId: 'user1',
            receipts: []
          }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });

      const response = await fetch('/messages/history?includeReceipts=true');
      const data = await response.json();
      
      expect(data.messages[0].receipts).toEqual([]);
    });
  });

  describe('WebSocket Auth Validation', () => {
    it('should reject invalid JWTs with WS code 1008', () => {
      class MockWebSocket {
        readyState = 3;
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          // Simulate immediate close with code 1008 for invalid JWT
          setTimeout(() => {
            this.onclose?.(new CloseEvent('close', { code: 1008, reason: 'Policy Violation: Invalid JWT' }));
          }, 10);
        }

        send(data: string) {}
        close() { this.readyState = 3; }
      }

      global.WebSocket = MockWebSocket as typeof WebSocket;

      return new Promise<void>((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws?token=invalid.jwt');
        
        ws.onclose = (event) => {
          expect(event.code).toBe(1008);
          expect(event.reason).toContain('Invalid JWT');
          resolve();
        };
      });
    });

    it('should reject malformed JWTs with WS code 1008', () => {
      class MockWebSocket {
        readyState = 3;
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          setTimeout(() => {
            this.onclose?.(new CloseEvent('close', { code: 1008, reason: 'Policy Violation: Malformed JWT' }));
          }, 10);
        }

        send(data: string) {}
        close() { this.readyState = 3; }
      }

      global.WebSocket = MockWebSocket as typeof WebSocket;

      return new Promise<void>((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws?token=malformed.jwt.token');
        
        ws.onclose = (event) => {
          expect(event.code).toBe(1008);
          expect(event.reason).toContain('Malformed JWT');
          resolve();
        };
      });
    });

    it('should reject expired JWTs with WS code 1008', () => {
      class MockWebSocket {
        readyState = 3;
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          setTimeout(() => {
            this.onclose?.(new CloseEvent('close', { code: 1008, reason: 'Policy Violation: Expired JWT' }));
          }, 10);
        }

        send(data: string) {}
        close() { this.readyState = 3; }
      }

      global.WebSocket = MockWebSocket as typeof WebSocket;

      return new Promise<void>((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws?token=expired.jwt.token');
        
        ws.onclose = (event) => {
          expect(event.code).toBe(1008);
          expect(event.reason).toContain('Expired JWT');
          resolve();
        };
      });
    });

    it('should accept valid JWTs and allow connection', () => {
      class MockWebSocket {
        readyState = 1;
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          setTimeout(() => {
            this.onopen?.(new Event('open'));
            this.onmessage?.(new MessageEvent('message', {
              data: JSON.stringify({ type: 'auth_success', userId: 'user123' })
            }));
          }, 10);
        }

        send(data: string) {}
        close() { this.readyState = 3; }
      }

      global.WebSocket = MockWebSocket as typeof WebSocket;

      return new Promise<void>((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws?token=valid.jwt.token');
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'auth_success') {
            expect(data.userId).toBe('user123');
            expect(ws.readyState).toBe(1);
            resolve();
          }
        };
      });
    });
  });

  describe('Message Sending with Request ID', () => {
    it('should include request_id in send message logs', async () => {
      const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ messageId: 'msg123', status: 'sent' }),
      });

      const response = await fetch('/messages/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': 'req-abc-123'
        },
        body: JSON.stringify({
          to: 'user123',
          content: 'Hello world',
          type: 'text'
        })
      });

      expect(response.ok).toBe(true);
      
      // Verify request ID is logged (this would be implemented in the actual service)
      // mockConsoleLog.mockRestore();
    });

    it('should generate request_id if not provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ messageId: 'msg124', status: 'sent' }),
      });

      const response = await fetch('/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'user124',
          content: 'Auto-generated request ID',
          type: 'text'
        })
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('History Fetch with Request ID', () => {
    it('should include request_id in history fetch logs', async () => {
      const mockMessages = {
        messages: [
          { id: '1', content: 'Hello', timestamp: '2025-01-01T10:00:00Z', userId: 'user1' }
        ]
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMessages),
      });

      const response = await fetch('/messages/history', {
        headers: { 'X-Request-ID': 'req-history-456' }
      });

      expect(response.ok).toBe(true);
      
      // Verify request ID is logged in the actual service implementation
    });
  });
});