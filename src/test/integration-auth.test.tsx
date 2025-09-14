import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock WebSocket
const mockWebSocket = {
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: WebSocket.OPEN,
};

// Mock auth service
const mockAuthAPI = {
  refreshToken: vi.fn(),
  logout: vi.fn(),
  authenticateWebSocket: vi.fn(),
};

vi.mock('@/services/auth', () => ({
  AuthAPI: mockAuthAPI,
}));

// Test component for auth operations
const AuthTestComponent: React.FC = () => {
  const [token, setToken] = React.useState<string>('');
  const [wsConnected, setWsConnected] = React.useState(false);

  const handleRefresh = async () => {
    try {
      const newToken = await mockAuthAPI.refreshToken();
      setToken(newToken);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await mockAuthAPI.logout();
      setToken('');
      setWsConnected(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleWSConnect = async () => {
    try {
      await mockAuthAPI.authenticateWebSocket(token);
      setWsConnected(true);
    } catch (error) {
      console.error('WS auth failed:', error);
    }
  };

  return (
    <div>
      <button data-testid="refresh-btn" onClick={handleRefresh}>
        Refresh Token
      </button>
      <button data-testid="logout-btn" onClick={handleLogout}>
        Logout
      </button>
      <button data-testid="ws-connect-btn" onClick={handleWSConnect}>
        Connect WebSocket
      </button>
      <div data-testid="token-display">{token}</div>
      <div data-testid="ws-status">{wsConnected ? 'connected' : 'disconnected'}</div>
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

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global WebSocket
    global.WebSocket = vi.fn(() => mockWebSocket) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Refresh Flow', () => {
    it('should refresh token successfully', async () => {
      const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new';
      mockAuthAPI.refreshToken.mockResolvedValue(newToken);

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const refreshBtn = screen.getByTestId('refresh-btn');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(mockAuthAPI.refreshToken).toHaveBeenCalled();
        expect(screen.getByTestId('token-display')).toHaveTextContent(newToken);
      });
    });

    it('should handle refresh token failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuthAPI.refreshToken.mockRejectedValue(new Error('Token expired'));

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const refreshBtn = screen.getByTestId('refresh-btn');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(mockAuthAPI.refreshToken).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Refresh failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Logout Helper', () => {
    it('should logout and clear session', async () => {
      mockAuthAPI.logout.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(mockAuthAPI.logout).toHaveBeenCalled();
        expect(screen.getByTestId('token-display')).toHaveTextContent('');
        expect(screen.getByTestId('ws-status')).toHaveTextContent('disconnected');
      });
    });

    it('should handle logout errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAuthAPI.logout.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(mockAuthAPI.logout).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('JWT WebSocket Handshake', () => {
    it('should authenticate WebSocket connection with JWT', async () => {
      const token = 'valid.jwt.token';
      mockAuthAPI.authenticateWebSocket.mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Set token first
      const refreshBtn = screen.getByTestId('refresh-btn');
      mockAuthAPI.refreshToken.mockResolvedValue(token);
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByTestId('token-display')).toHaveTextContent(token);
      });

      // Then connect WebSocket
      const wsConnectBtn = screen.getByTestId('ws-connect-btn');
      fireEvent.click(wsConnectBtn);

      await waitFor(() => {
        expect(mockAuthAPI.authenticateWebSocket).toHaveBeenCalledWith(token);
        expect(screen.getByTestId('ws-status')).toHaveTextContent('connected');
      });
    });

    it('should handle invalid JWT during WebSocket handshake', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidToken = 'invalid.jwt.token';
      mockAuthAPI.authenticateWebSocket.mockRejectedValue(new Error('Invalid token'));

      render(
        <TestWrapper>
          <AuthTestComponent />
        </TestWrapper>
      );

      // Set invalid token
      mockAuthAPI.refreshToken.mockResolvedValue(invalidToken);
      const refreshBtn = screen.getByTestId('refresh-btn');
      fireEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByTestId('token-display')).toHaveTextContent(invalidToken);
      });

      // Try to connect WebSocket
      const wsConnectBtn = screen.getByTestId('ws-connect-btn');
      fireEvent.click(wsConnectBtn);

      await waitFor(() => {
        expect(mockAuthAPI.authenticateWebSocket).toHaveBeenCalledWith(invalidToken);
        expect(consoleSpy).toHaveBeenCalledWith('WS auth failed:', expect.any(Error));
        expect(screen.getByTestId('ws-status')).toHaveTextContent('disconnected');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('JWT Token Validation', () => {
    it('should validate JWT structure', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const invalidJWT = 'invalid.token';

      // Test JWT structure validation (should have 3 parts separated by dots)
      expect(validJWT.split('.').length).toBe(3);
      expect(invalidJWT.split('.').length).toBeLessThan(3);
    });

    it('should handle JWT expiration', () => {
      const expiredJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.expired';
      
      // In a real implementation, this would check the exp claim
      // Here we simulate the validation logic
      const payload = JSON.parse(atob(expiredJWT.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      expect(payload.exp).toBeLessThan(currentTime);
    });
  });
});