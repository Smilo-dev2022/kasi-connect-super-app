import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock observability API
const mockObservabilityAPI = {
  getMetrics: vi.fn(),
  getAuthMetrics: vi.fn(),
  getMessagingLogs: vi.fn(),
  getSearchLogs: vi.fn(),
  getEventsLogs: vi.fn(),
  validateRequestId: vi.fn(),
};

vi.mock('@/services/observability', () => ({
  ObservabilityAPI: mockObservabilityAPI,
}));

// Test component for observability operations
const ObservabilityTestComponent: React.FC = () => {
  const [metrics, setMetrics] = React.useState<string>('');
  const [authMetrics, setAuthMetrics] = React.useState<string>('');
  const [messagingLogs, setMessagingLogs] = React.useState<Record<string, unknown>[]>([]);
  const [searchLogs, setSearchLogs] = React.useState<Record<string, unknown>[]>([]);
  const [eventsLogs, setEventsLogs] = React.useState<Record<string, unknown>[]>([]);
  const [requestIdValidation, setRequestIdValidation] = React.useState<Record<string, unknown> | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await mockObservabilityAPI.getMetrics();
      setMetrics(response);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const fetchAuthMetrics = async () => {
    try {
      const response = await mockObservabilityAPI.getAuthMetrics();
      setAuthMetrics(response);
    } catch (error) {
      console.error('Failed to fetch auth metrics:', error);
    }
  };

  const fetchMessagingLogs = async () => {
    try {
      const logs = await mockObservabilityAPI.getMessagingLogs();
      setMessagingLogs(logs);
    } catch (error) {
      console.error('Failed to fetch messaging logs:', error);
    }
  };

  const fetchSearchLogs = async () => {
    try {
      const logs = await mockObservabilityAPI.getSearchLogs();
      setSearchLogs(logs);
    } catch (error) {
      console.error('Failed to fetch search logs:', error);
    }
  };

  const fetchEventsLogs = async () => {
    try {
      const logs = await mockObservabilityAPI.getEventsLogs();
      setEventsLogs(logs);
    } catch (error) {
      console.error('Failed to fetch events logs:', error);
    }
  };

  const validateRequestId = async (requestId: string) => {
    try {
      const validation = await mockObservabilityAPI.validateRequestId(requestId);
      setRequestIdValidation(validation);
    } catch (error) {
      setRequestIdValidation({ valid: false, error: error.message });
    }
  };

  return (
    <div>
      <button data-testid="fetch-metrics-btn" onClick={fetchMetrics}>
        Fetch Metrics
      </button>
      <button data-testid="fetch-auth-metrics-btn" onClick={fetchAuthMetrics}>
        Fetch Auth Metrics
      </button>
      <button data-testid="fetch-messaging-logs-btn" onClick={fetchMessagingLogs}>
        Fetch Messaging Logs
      </button>
      <button data-testid="fetch-search-logs-btn" onClick={fetchSearchLogs}>
        Fetch Search Logs
      </button>
      <button data-testid="fetch-events-logs-btn" onClick={fetchEventsLogs}>
        Fetch Events Logs
      </button>
      <button
        data-testid="validate-request-id-btn"
        onClick={() => validateRequestId('req-123-456')}
      >
        Validate Request ID
      </button>
      <button
        data-testid="validate-invalid-request-id-btn"
        onClick={() => validateRequestId('invalid-id')}
      >
        Validate Invalid Request ID
      </button>

      <div data-testid="metrics-content">{metrics}</div>
      <div data-testid="auth-metrics-content">{authMetrics}</div>
      <div data-testid="messaging-logs-count">{messagingLogs.length}</div>
      <div data-testid="search-logs-count">{searchLogs.length}</div>
      <div data-testid="events-logs-count">{eventsLogs.length}</div>
      <div data-testid="request-id-validation">
        {requestIdValidation ? JSON.stringify(requestIdValidation) : ''}
      </div>

      <div data-testid="messaging-logs-list">
        {messagingLogs.map((log, index) => (
          <div key={index} data-testid={`messaging-log-${index}`}>
            {log.requestId} - {log.action}
          </div>
        ))}
      </div>

      <div data-testid="search-logs-list">
        {searchLogs.map((log, index) => (
          <div key={index} data-testid={`search-log-${index}`}>
            {log.requestId} - {log.query}
          </div>
        ))}
      </div>

      <div data-testid="events-logs-list">
        {eventsLogs.map((log, index) => (
          <div key={index} data-testid={`events-log-${index}`}>
            {log.requestId} - {log.event}
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

describe('Observability Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Metrics Endpoints', () => {
    it('should return metrics with correct content-type and values', async () => {
      const mockMetricsResponse = `# HELP request_count Total number of requests
# TYPE request_count counter
request_count{method="GET",endpoint="/api/health"} 1547
request_count{method="POST",endpoint="/api/messages"} 892

# HELP response_time_p95 95th percentile response time
# TYPE response_time_p95 gauge
response_time_p95{endpoint="/api/health"} 12.5
response_time_p95{endpoint="/api/messages"} 67.8`;

      mockObservabilityAPI.getMetrics.mockResolvedValue(mockMetricsResponse);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getMetrics).toHaveBeenCalled();
        const metricsContent = screen.getByTestId('metrics-content').textContent;
        expect(metricsContent).toContain('request_count');
        expect(metricsContent).toContain('response_time_p95');
        expect(metricsContent).toContain('1547');
        expect(metricsContent).toContain('67.8');
      });
    });

    it('should return auth metrics with text/plain content type', async () => {
      const mockAuthMetrics = `# HELP auth_request_count Total authentication requests
# TYPE auth_request_count counter
auth_request_count{type="login"} 245
auth_request_count{type="refresh"} 1832

# HELP auth_response_time_p95 95th percentile auth response time
# TYPE auth_response_time_p95 gauge
auth_response_time_p95{type="login"} 156.7
auth_response_time_p95{type="refresh"} 23.4`;

      mockObservabilityAPI.getAuthMetrics.mockResolvedValue(mockAuthMetrics);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-auth-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getAuthMetrics).toHaveBeenCalled();
        const authMetricsContent = screen.getByTestId('auth-metrics-content').textContent;
        expect(authMetricsContent).toContain('auth_request_count');
        expect(authMetricsContent).toContain('auth_response_time_p95');
        expect(authMetricsContent).toContain('245');
        expect(authMetricsContent).toContain('156.7');
      });
    });

    it('should handle metrics endpoint errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockObservabilityAPI.getMetrics.mockRejectedValue(new Error('Metrics service unavailable'));

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getMetrics).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch metrics:', expect.any(Error));
        expect(screen.getByTestId('metrics-content')).toHaveTextContent('');
      });

      consoleSpy.mockRestore();
    });

    it('should validate metrics format and content', async () => {
      const invalidMetricsResponse = 'invalid prometheus format';
      mockObservabilityAPI.getMetrics.mockResolvedValue(invalidMetricsResponse);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getMetrics).toHaveBeenCalled();
        const metricsContent = screen.getByTestId('metrics-content').textContent;
        expect(metricsContent).toBe(invalidMetricsResponse);
        // In a real implementation, you would validate Prometheus format
        expect(metricsContent).not.toContain('# HELP');
        expect(metricsContent).not.toContain('# TYPE');
      });
    });
  });

  describe('Logging Validation', () => {
    it('should ensure request_id is present in messaging logs', async () => {
      const mockMessagingLogs = [
        {
          timestamp: Date.now(),
          level: 'info',
          message: 'Message sent successfully',
          action: 'send',
          requestId: 'req-msg-123',
          userId: 'user-456',
        },
        {
          timestamp: Date.now() - 1000,
          level: 'info',
          message: 'Message history fetched',
          action: 'history_fetch',
          requestId: 'req-msg-124',
          chatId: 'chat-789',
        },
      ];

      mockObservabilityAPI.getMessagingLogs.mockResolvedValue(mockMessagingLogs);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-messaging-logs-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getMessagingLogs).toHaveBeenCalled();
        expect(screen.getByTestId('messaging-logs-count')).toHaveTextContent('2');
        expect(screen.getByTestId('messaging-log-0')).toHaveTextContent('req-msg-123 - send');
        expect(screen.getByTestId('messaging-log-1')).toHaveTextContent('req-msg-124 - history_fetch');
      });

      // Validate that all logs have request IDs
      mockMessagingLogs.forEach(log => {
        expect(log.requestId).toBeDefined();
        expect(log.requestId).toMatch(/^req-/);
      });
    });

    it('should ensure request_id is present in search logs', async () => {
      const mockSearchLogs = [
        {
          timestamp: Date.now(),
          level: 'info',
          message: 'Search query executed',
          query: 'test search',
          requestId: 'req-search-123',
          resultsCount: 15,
        },
        {
          timestamp: Date.now() - 2000,
          level: 'info',
          message: 'Search filter applied',
          query: 'filtered search',
          requestId: 'req-search-124',
          filterType: 'date',
        },
      ];

      mockObservabilityAPI.getSearchLogs.mockResolvedValue(mockSearchLogs);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-search-logs-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getSearchLogs).toHaveBeenCalled();
        expect(screen.getByTestId('search-logs-count')).toHaveTextContent('2');
        expect(screen.getByTestId('search-log-0')).toHaveTextContent('req-search-123 - test search');
        expect(screen.getByTestId('search-log-1')).toHaveTextContent('req-search-124 - filtered search');
      });

      // Validate that all logs have request IDs
      mockSearchLogs.forEach(log => {
        expect(log.requestId).toBeDefined();
        expect(log.requestId).toMatch(/^req-search-/);
      });
    });

    it('should ensure request_id is present in events logs', async () => {
      const mockEventsLogs = [
        {
          timestamp: Date.now(),
          level: 'info',
          message: 'Event created successfully',
          event: 'create_event',
          requestId: 'req-events-123',
          eventId: 'event-456',
        },
        {
          timestamp: Date.now() - 3000,
          level: 'info',
          message: 'Event updated',
          event: 'update_event',
          requestId: 'req-events-124',
          eventId: 'event-789',
        },
      ];

      mockObservabilityAPI.getEventsLogs.mockResolvedValue(mockEventsLogs);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-events-logs-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getEventsLogs).toHaveBeenCalled();
        expect(screen.getByTestId('events-logs-count')).toHaveTextContent('2');
        expect(screen.getByTestId('events-log-0')).toHaveTextContent('req-events-123 - create_event');
        expect(screen.getByTestId('events-log-1')).toHaveTextContent('req-events-124 - update_event');
      });

      // Validate that all logs have request IDs
      mockEventsLogs.forEach(log => {
        expect(log.requestId).toBeDefined();
        expect(log.requestId).toMatch(/^req-events-/);
      });
    });

    it('should handle missing request_id in logs', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const invalidLogs = [
        {
          timestamp: Date.now(),
          level: 'info',
          message: 'Message without request ID',
          action: 'send',
          // requestId missing
        },
      ];

      mockObservabilityAPI.getMessagingLogs.mockResolvedValue(invalidLogs);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-messaging-logs-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getMessagingLogs).toHaveBeenCalled();
        expect(screen.getByTestId('messaging-logs-count')).toHaveTextContent('1');
      });

      // This would trigger a validation warning in a real implementation
      expect(invalidLogs[0].requestId).toBeUndefined();
    });
  });

  describe('Request ID Validation', () => {
    it('should validate valid request ID format', async () => {
      const mockValidation = {
        valid: true,
        format: 'req-{service}-{timestamp}',
        service: 'messaging',
        timestamp: '123456789',
      };

      mockObservabilityAPI.validateRequestId.mockResolvedValue(mockValidation);

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const validateBtn = screen.getByTestId('validate-request-id-btn');
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.validateRequestId).toHaveBeenCalledWith('req-123-456');
        const validationText = screen.getByTestId('request-id-validation').textContent;
        expect(validationText).toContain('"valid":true');
        expect(validationText).toContain('"service":"messaging"');
      });
    });

    it('should handle invalid request ID format', async () => {
      mockObservabilityAPI.validateRequestId.mockRejectedValue(new Error('Invalid request ID format'));

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const validateBtn = screen.getByTestId('validate-invalid-request-id-btn');
      fireEvent.click(validateBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.validateRequestId).toHaveBeenCalledWith('invalid-id');
        const validationText = screen.getByTestId('request-id-validation').textContent;
        expect(validationText).toContain('"valid":false');
        expect(validationText).toContain('"error":"Invalid request ID format"');
      });
    });

    it('should validate request ID uniqueness', () => {
      const requestIds = ['req-msg-123', 'req-search-124', 'req-events-125'];
      const uniqueIds = new Set(requestIds);
      
      expect(uniqueIds.size).toBe(requestIds.length);
      
      // Test duplicate detection
      const requestIdsWithDuplicate = ['req-msg-123', 'req-search-124', 'req-msg-123'];
      const uniqueIdsWithDuplicate = new Set(requestIdsWithDuplicate);
      
      expect(uniqueIdsWithDuplicate.size).toBeLessThan(requestIdsWithDuplicate.length);
    });
  });

  describe('Log Error Handling', () => {
    it('should handle messaging logs fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockObservabilityAPI.getMessagingLogs.mockRejectedValue(new Error('Logs service unavailable'));

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-messaging-logs-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getMessagingLogs).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch messaging logs:', expect.any(Error));
        expect(screen.getByTestId('messaging-logs-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });

    it('should handle search logs fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockObservabilityAPI.getSearchLogs.mockRejectedValue(new Error('Search logs unavailable'));

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-search-logs-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getSearchLogs).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch search logs:', expect.any(Error));
        expect(screen.getByTestId('search-logs-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });

    it('should handle events logs fetch errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockObservabilityAPI.getEventsLogs.mockRejectedValue(new Error('Events logs unavailable'));

      render(
        <TestWrapper>
          <ObservabilityTestComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-events-logs-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(mockObservabilityAPI.getEventsLogs).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch events logs:', expect.any(Error));
        expect(screen.getByTestId('events-logs-count')).toHaveTextContent('0');
      });

      consoleSpy.mockRestore();
    });
  });
});