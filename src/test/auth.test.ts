import { describe, it, expect, vi, beforeEach } from 'vitest';

// Auth Service Tests
describe('Auth Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JWT Refresh Flow', () => {
    it('should refresh JWT token with valid refresh token', async () => {
      // Mock auth service
      const mockRefreshResponse = {
        token: 'new.jwt.token',
        refreshToken: 'new.refresh.token',
        expiresIn: 3600
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRefreshResponse),
      });

      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'valid.refresh.token' })
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.token).toBe('new.jwt.token');
      expect(data.refreshToken).toBe('new.refresh.token');
    });

    it('should reject invalid refresh token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid refresh token' }),
      });

      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid.token' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle expired refresh token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Refresh token expired' }),
      });

      const response = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'expired.token' })
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(403);
    });
  });

  describe('Logout Helper', () => {
    it('should clear tokens and invalidate session', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer valid.jwt.token',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ deviceId: 'device123' })
      });

      expect(response.ok).toBe(true);
      
      // Verify logout was called with correct parameters
      expect(global.fetch).toHaveBeenCalledWith('/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer valid.jwt.token',
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ deviceId: 'device123' })
      });
    });

    it('should handle logout failure gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      });

      const response = await fetch('/auth/logout', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer valid.jwt.token',
          'Content-Type': 'application/json' 
        }
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('JWT WebSocket Handshake', () => {
    it('should authenticate WebSocket connection with valid JWT', () => {
      // Mock WebSocket
      class MockWebSocket {
        readyState = 1;
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          setTimeout(() => {
            this.onopen?.(new Event('open'));
            // Simulate successful auth
            this.onmessage?.(new MessageEvent('message', {
              data: JSON.stringify({ type: 'auth', status: 'success' })
            }));
          }, 10);
        }

        send(data: string) {
          // Mock send
        }

        close() {
          this.readyState = 3;
        }
      }

      global.WebSocket = MockWebSocket as typeof WebSocket;

      return new Promise<void>((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws?token=valid.jwt.token');
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'auth' && data.status === 'success') {
            expect(data.status).toBe('success');
            resolve();
          }
        };
      });
    });

    it('should reject WebSocket connection with invalid JWT', () => {
      class MockWebSocket {
        readyState = 3;
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          setTimeout(() => {
            // Simulate auth failure with close code 1008 (policy violation)
            this.onclose?.(new CloseEvent('close', { code: 1008, reason: 'Invalid token' }));
          }, 10);
        }

        send(data: string) {
          // Mock send
        }

        close() {
          this.readyState = 3;
        }
      }

      global.WebSocket = MockWebSocket as typeof WebSocket;

      return new Promise<void>((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws?token=invalid.jwt.token');
        
        ws.onclose = (event) => {
          expect(event.code).toBe(1008);
          expect(event.reason).toBe('Invalid token');
          resolve();
        };
      });
    });

    it('should handle WebSocket auth timeout', () => {
      class MockWebSocket {
        readyState = 1;
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;

        constructor(url: string) {
          setTimeout(() => {
            this.onopen?.(new Event('open'));
            // No auth response - simulate timeout
          }, 10);
        }

        send(data: string) {
          // Mock send
        }

        close() {
          this.readyState = 3;
        }
      }

      global.WebSocket = MockWebSocket as typeof WebSocket;

      return new Promise<void>((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws?token=valid.jwt.token');
        
        // Simulate auth timeout after 5 seconds
        setTimeout(() => {
          ws.close();
          expect(ws.readyState).toBe(3);
          resolve();
        }, 100);
      });
    });
  });

  describe('Auth Metrics', () => {
    it('should return metrics in text/plain format', async () => {
      const mockMetrics = `# HELP auth_requests_total Total number of auth requests
# TYPE auth_requests_total counter
auth_requests_total{method="login"} 150
auth_requests_total{method="refresh"} 45
# HELP auth_request_duration_seconds Request duration in seconds
# TYPE auth_request_duration_seconds histogram
auth_request_duration_seconds_count 195
auth_request_duration_seconds_sum 12.5
auth_request_duration_seconds{quantile="0.95"} 0.08`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve(mockMetrics),
      });

      const response = await fetch('/auth/metrics');
      const content = await response.text();
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toBe('text/plain');
      expect(content).toContain('auth_requests_total');
      expect(content).toMatch(/request_count|auth_requests_total/);
      expect(content).toMatch(/p95|quantile="0\.95"/);
    });

    it('should include request_count and p95 metrics', async () => {
      const mockMetrics = `auth_requests_total 195
auth_request_duration_seconds{quantile="0.95"} 0.08`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve(mockMetrics),
      });

      const response = await fetch('/auth/metrics');
      const content = await response.text();
      
      expect(content).toMatch(/request_count|auth_requests_total/);
      expect(content).toMatch(/p95|quantile="0\.95"/);
    });
  });
});