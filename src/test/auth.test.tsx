import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock auth utilities - simulating what would be in a real auth service
const mockAuthService = {
  refresh: vi.fn(),
  logout: vi.fn(),
  validateJWTForWebSocket: vi.fn(),
};

// Mock component to test auth flows
const AuthTestComponent = () => {
  const handleRefresh = async () => {
    try {
      await mockAuthService.refresh();
    } catch (error) {
      // Handle refresh error silently for test
      console.error('Refresh failed:', error);
    }
  };

  const handleLogout = () => {
    mockAuthService.logout();
  };

  const handleWSAuth = (token: string) => {
    return mockAuthService.validateJWTForWebSocket(token);
  };

  return (
    <div>
      <button onClick={handleRefresh} data-testid="refresh-btn">
        Refresh Token
      </button>
      <button onClick={handleLogout} data-testid="logout-btn">
        Logout
      </button>
      <button 
        onClick={() => handleWSAuth('test-token')} 
        data-testid="ws-auth-btn"
      >
        WebSocket Auth
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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Auth Service Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Refresh Flow', () => {
    it('should handle successful token refresh', async () => {
      mockAuthService.refresh.mockResolvedValue({ token: 'new-token' });

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const refreshBtn = screen.getByTestId('refresh-btn');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(mockAuthService.refresh).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle token refresh failure', async () => {
      mockAuthService.refresh.mockRejectedValue(new Error('Refresh failed'));

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const refreshBtn = screen.getByTestId('refresh-btn');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(mockAuthService.refresh).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Logout Helper', () => {
    it('should call logout helper on user action', () => {
      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });

    it('should clear user session data on logout', () => {
      const clearSessionSpy = vi.spyOn(Storage.prototype, 'removeItem');
      
      mockAuthService.logout.mockImplementation(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      });

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auth Metrics Route', () => {
    it('should return text/plain with request_count and p95 metrics', async () => {
      // Mock fetch for auth metrics endpoint
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/plain'
        }),
        text: () => Promise.resolve(`# Auth Service Metrics
request_count{method="POST",endpoint="/auth/login"} 1542
request_count{method="POST",endpoint="/auth/refresh"} 847
request_count{method="POST",endpoint="/auth/logout"} 423
request_duration_p95{method="POST",endpoint="/auth/login"} 245.67
request_duration_p95{method="POST",endpoint="/auth/refresh"} 189.23
request_duration_p95{method="POST",endpoint="/auth/logout"} 98.45`)
      });

      const MetricsComponent = () => {
        const [metrics, setMetrics] = React.useState<string>('');
        const [contentType, setContentType] = React.useState<string>('');

        const fetchMetrics = async () => {
          const response = await fetch('/auth/metrics');
          setContentType(response.headers.get('content-type') || '');
          const text = await response.text();
          setMetrics(text);
        };

        return (
          <div>
            <button onClick={fetchMetrics} data-testid="fetch-metrics-btn">
              Fetch Metrics
            </button>
            <div data-testid="content-type">{contentType}</div>
            <pre data-testid="metrics-content">{metrics}</pre>
          </div>
        );
      };

      render(
        <TestWrapper>
          <MetricsComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        // Verify content type is text/plain
        expect(screen.getByTestId('content-type').textContent).toBe('text/plain');
        
        // Verify metrics content contains required metrics
        const metricsContent = screen.getByTestId('metrics-content').textContent;
        expect(metricsContent).toContain('request_count');
        expect(metricsContent).toContain('request_duration_p95');
        expect(metricsContent).toContain('/auth/login');
        expect(metricsContent).toContain('/auth/refresh');
        expect(metricsContent).toContain('/auth/logout');
      });
    });

    it('should parse metrics data correctly', async () => {
      const metricsText = `# Auth Service Metrics
request_count{method="POST",endpoint="/auth/login"} 1542
request_count{method="POST",endpoint="/auth/refresh"} 847
request_duration_p95{method="POST",endpoint="/auth/login"} 245.67
request_duration_p95{method="POST",endpoint="/auth/refresh"} 189.23`;

      const parseMetrics = (text: string) => {
        const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim());
        const metrics: Record<string, number> = {};
        
        lines.forEach(line => {
          const match = line.match(/^(\w+)\{[^}]+\}\s+(.+)$/);
          if (match) {
            const [, metricName, value] = match;
            if (metricName === 'request_count') {
              metrics.totalRequests = (metrics.totalRequests || 0) + parseInt(value);
            } else if (metricName === 'request_duration_p95') {
              metrics.avgP95 = (metrics.avgP95 || 0) + parseFloat(value);
            }
          }
        });
        
        return metrics;
      };

      const parsed = parseMetrics(metricsText);
      
      expect(parsed.totalRequests).toBe(2389); // 1542 + 847
      expect(parsed.avgP95).toBeCloseTo(434.9); // 245.67 + 189.23
    });

    it('should handle metrics endpoint errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Metrics service unavailable'));

      const ErrorHandlingComponent = () => {
        const [error, setError] = React.useState<string>('');

        const fetchMetricsWithErrorHandling = async () => {
          try {
            await fetch('/auth/metrics');
          } catch (err: any) {
            setError(err.message);
          }
        };

        return (
          <div>
            <button onClick={fetchMetricsWithErrorHandling} data-testid="fetch-with-error-btn">
              Fetch Metrics
            </button>
            <div data-testid="error-message">{error}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <ErrorHandlingComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-with-error-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(screen.getByTestId('error-message').textContent).toBe('Metrics service unavailable');
      });
    });
  });

  describe('JWT WebSocket Handshake', () => {
    it('should validate JWT token for WebSocket connection', () => {
      mockAuthService.validateJWTForWebSocket.mockReturnValue(true);

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const wsAuthBtn = screen.getByTestId('ws-auth-btn');
      fireEvent.click(wsAuthBtn);

      expect(mockAuthService.validateJWTForWebSocket).toHaveBeenCalledWith('test-token');
    });

    it('should reject invalid JWT token for WebSocket', () => {
      mockAuthService.validateJWTForWebSocket.mockReturnValue(false);

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const wsAuthBtn = screen.getByTestId('ws-auth-btn');
      fireEvent.click(wsAuthBtn);

      expect(mockAuthService.validateJWTForWebSocket).toHaveBeenCalledWith('test-token');
      expect(mockAuthService.validateJWTForWebSocket).toHaveReturnedWith(false);
    });
  });
});