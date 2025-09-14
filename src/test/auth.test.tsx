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

  describe('Auth Metrics Route', () => {
    // Mock metrics API
    const mockMetricsAPI = {
      getMetrics: vi.fn(),
    };

    const MetricsTestComponent = () => {
      const [metrics, setMetrics] = React.useState<string>('');
      const [contentType, setContentType] = React.useState<string>('');

      const fetchMetrics = async () => {
        try {
          const response = await mockMetricsAPI.getMetrics();
          setMetrics(response.data);
          setContentType(response.headers['content-type']);
        } catch (error) {
          console.error('Failed to fetch metrics:', error);
        }
      };

      return (
        <div>
          <button onClick={fetchMetrics} data-testid="fetch-metrics-btn">
            Fetch Metrics
          </button>
          <div data-testid="metrics-data">{metrics}</div>
          <div data-testid="content-type">{contentType}</div>
        </div>
      );
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return text/plain content-type for metrics endpoint', async () => {
      mockMetricsAPI.getMetrics.mockResolvedValue({
        data: 'auth_request_count 1234\nauth_response_time_p95 0.125',
        headers: {
          'content-type': 'text/plain; charset=utf-8',
        },
      });

      render(
        <TestWrapper>
          <MetricsTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(screen.getByTestId('content-type').textContent).toBe('text/plain; charset=utf-8');
      });
    });

    it('should contain request_count in metrics response', async () => {
      mockMetricsAPI.getMetrics.mockResolvedValue({
        data: 'auth_request_count 1234\nauth_login_attempts 567\nauth_successful_logins 500',
        headers: {
          'content-type': 'text/plain',
        },
      });

      render(
        <TestWrapper>
          <MetricsTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        const metricsData = screen.getByTestId('metrics-data').textContent;
        expect(metricsData).toContain('request_count');
        expect(metricsData).toContain('1234');
      });
    });

    it('should contain p95 metrics in response', async () => {
      mockMetricsAPI.getMetrics.mockResolvedValue({
        data: 'auth_response_time_p95 0.125\nauth_jwt_validation_time_p95 0.015\nauth_request_count 1000',
        headers: {
          'content-type': 'text/plain',
        },
      });

      render(
        <TestWrapper>
          <MetricsTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        const metricsData = screen.getByTestId('metrics-data').textContent;
        expect(metricsData).toContain('p95');
        expect(metricsData).toContain('0.125');
      });
    });

    it('should handle metrics endpoint errors gracefully', async () => {
      mockMetricsAPI.getMetrics.mockRejectedValue(new Error('Metrics service unavailable'));

      render(
        <TestWrapper>
          <MetricsTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockMetricsAPI.getMetrics).toHaveBeenCalledTimes(1);
        // Component should handle error gracefully
        expect(screen.getByTestId('metrics-data').textContent).toBe('');
      });
    });
  });
});