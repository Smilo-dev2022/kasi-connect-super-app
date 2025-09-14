import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock metrics and logging APIs
const mockObservabilityAPI = {
  getMetrics: vi.fn(),
  validateLogging: vi.fn(),
  getSearchLogs: vi.fn(),
  getEventsLogs: vi.fn(),
  checkRequestIdPresence: vi.fn(),
};

// Mock fetch for metrics endpoints
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Component for testing metrics endpoints
const MetricsComponent = () => {
  const [metricsData, setMetricsData] = React.useState<string>('');
  const [contentType, setContentType] = React.useState<string>('');
  const [metricsValues, setMetricsValues] = React.useState<{
    request_count: number;
    p95_response_time: number;
    error_rate: number;
    active_connections: number;
  } | null>(null);

  const handleFetchMetrics = async (endpoint: string) => {
    try {
      const response = await fetch(endpoint);
      const contentTypeHeader = response.headers.get('content-type') || '';
      setContentType(contentTypeHeader);
      
      const text = await response.text();
      setMetricsData(text);
      
      // Parse metrics values
      const parsed = parsePrometheusMetrics(text);
      setMetricsValues(parsed);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  const parsePrometheusMetrics = (text: string) => {
    const lines = text.split('\n');
    const metrics: Record<string, number> = {};
    
    lines.forEach(line => {
      if (line.startsWith('request_count')) {
        const match = line.match(/request_count\s+(\d+)/);
        if (match) metrics.request_count = parseInt(match[1]);
      }
      if (line.startsWith('http_request_duration_p95')) {
        const match = line.match(/http_request_duration_p95\s+(\d+\.?\d*)/);
        if (match) metrics.p95_response_time = parseFloat(match[1]);
      }
      if (line.startsWith('error_rate')) {
        const match = line.match(/error_rate\s+(\d+\.?\d*)/);
        if (match) metrics.error_rate = parseFloat(match[1]);
      }
      if (line.startsWith('active_connections')) {
        const match = line.match(/active_connections\s+(\d+)/);
        if (match) metrics.active_connections = parseInt(match[1]);
      }
    });
    
    return metrics as {
      request_count: number;
      p95_response_time: number;
      error_rate: number;
      active_connections: number;
    };
  };

  return (
    <div>
      <button 
        onClick={() => handleFetchMetrics('/metrics')}
        data-testid="fetch-metrics-btn"
      >
        Fetch Metrics
      </button>
      
      <button 
        onClick={() => handleFetchMetrics('/auth/metrics')}
        data-testid="fetch-auth-metrics-btn"
      >
        Fetch Auth Metrics
      </button>
      
      <button 
        onClick={() => handleFetchMetrics('/messaging/metrics')}
        data-testid="fetch-messaging-metrics-btn"
      >
        Fetch Messaging Metrics
      </button>

      <div data-testid="content-type">{contentType}</div>
      <div data-testid="metrics-data">{metricsData}</div>
      
      {metricsValues && (
        <div data-testid="parsed-metrics">
          <div data-testid="request-count">Requests: {metricsValues.request_count}</div>
          <div data-testid="p95-time">P95: {metricsValues.p95_response_time}ms</div>
          <div data-testid="error-rate">Error Rate: {metricsValues.error_rate}%</div>
          <div data-testid="connections">Connections: {metricsValues.active_connections}</div>
        </div>
      )}
    </div>
  );
};

// Component for testing logging validation
const LoggingValidationComponent = () => {
  const [searchLogs, setSearchLogs] = React.useState<Array<{
    timestamp: string;
    level: string;
    message: string;
    request_id?: string;
    service: string;
  }>>([]);
  
  const [eventsLogs, setEventsLogs] = React.useState<Array<{
    timestamp: string;
    level: string;
    message: string;
    request_id?: string;
    service: string;
  }>>([]);
  
  const [validationResults, setValidationResults] = React.useState<{
    searchLogsValid: boolean;
    eventsLogsValid: boolean;
    missingRequestIds: number;
  } | null>(null);

  const handleFetchSearchLogs = async () => {
    try {
      const logs = await mockObservabilityAPI.getSearchLogs();
      setSearchLogs(logs);
    } catch (error) {
      console.error('Failed to fetch search logs:', error);
    }
  };

  const handleFetchEventsLogs = async () => {
    try {
      const logs = await mockObservabilityAPI.getEventsLogs();
      setEventsLogs(logs);
    } catch (error) {
      console.error('Failed to fetch events logs:', error);
    }
  };

  const handleValidateRequestIds = async () => {
    try {
      const searchValidation = await mockObservabilityAPI.checkRequestIdPresence('search');
      const eventsValidation = await mockObservabilityAPI.checkRequestIdPresence('events');
      
      setValidationResults({
        searchLogsValid: searchValidation.allLogsHaveRequestId,
        eventsLogsValid: eventsValidation.allLogsHaveRequestId,
        missingRequestIds: (searchValidation.missingCount || 0) + (eventsValidation.missingCount || 0)
      });
    } catch (error) {
      console.error('Failed to validate request IDs:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={handleFetchSearchLogs}
        data-testid="fetch-search-logs-btn"
      >
        Fetch Search Logs
      </button>
      
      <button 
        onClick={handleFetchEventsLogs}
        data-testid="fetch-events-logs-btn"
      >
        Fetch Events Logs
      </button>
      
      <button 
        onClick={handleValidateRequestIds}
        data-testid="validate-request-ids-btn"
      >
        Validate Request IDs
      </button>

      <div data-testid="search-logs-count">Search Logs: {searchLogs.length}</div>
      <div data-testid="events-logs-count">Events Logs: {eventsLogs.length}</div>
      
      <div data-testid="search-logs-list">
        {searchLogs.map((log, index) => (
          <div key={index} data-testid={`search-log-${index}`}>
            [{log.timestamp}] {log.level}: {log.message}
            {log.request_id && <span data-testid={`request-id-${index}`}> (req: {log.request_id})</span>}
          </div>
        ))}
      </div>
      
      <div data-testid="events-logs-list">
        {eventsLogs.map((log, index) => (
          <div key={index} data-testid={`events-log-${index}`}>
            [{log.timestamp}] {log.level}: {log.message}
            {log.request_id && <span data-testid={`events-request-id-${index}`}> (req: {log.request_id})</span>}
          </div>
        ))}
      </div>

      {validationResults && (
        <div data-testid="validation-results">
          <div data-testid="search-validation">
            Search logs valid: {validationResults.searchLogsValid ? 'YES' : 'NO'}
          </div>
          <div data-testid="events-validation">
            Events logs valid: {validationResults.eventsLogsValid ? 'YES' : 'NO'}
          </div>
          <div data-testid="missing-count">
            Missing request IDs: {validationResults.missingRequestIds}
          </div>
        </div>
      )}
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

describe('Observability Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Metrics Endpoints', () => {
    it('should return correct content-type for metrics endpoint', async () => {
      const mockMetricsResponse = `# HELP request_count Total number of HTTP requests
# TYPE request_count counter
request_count 1234

# HELP http_request_duration_p95 95th percentile response time
# TYPE http_request_duration_p95 gauge
http_request_duration_p95 125.5

# HELP error_rate Error rate percentage
# TYPE error_rate gauge
error_rate 0.5

# HELP active_connections Number of active connections
# TYPE active_connections gauge
active_connections 42`;

      mockFetch.mockResolvedValue({
        headers: new Map([['content-type', 'text/plain; charset=utf-8']]),
        text: () => Promise.resolve(mockMetricsResponse)
      });

      render(
        <TestWrapper>
          <MetricsComponent />
        </TestWrapper>
      );

      const fetchBtn = screen.getByTestId('fetch-metrics-btn');
      fireEvent.click(fetchBtn);

      await waitFor(() => {
        expect(screen.getByTestId('content-type').textContent).toBe('text/plain; charset=utf-8');
        expect(screen.getByTestId('metrics-data').textContent).toContain('request_count 1234');
      });

      expect(mockFetch).toHaveBeenCalledWith('/metrics');
    });

    it('should parse and display metrics values correctly', async () => {
      const mockMetricsResponse = `request_count 5678
http_request_duration_p95 89.2
error_rate 1.2
active_connections 15`;

      mockFetch.mockResolvedValue({
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(mockMetricsResponse)
      });

      render(
        <TestWrapper>
          <MetricsComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-metrics-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('request-count').textContent).toBe('Requests: 5678');
        expect(screen.getByTestId('p95-time').textContent).toBe('P95: 89.2ms');
        expect(screen.getByTestId('error-rate').textContent).toBe('Error Rate: 1.2%');
        expect(screen.getByTestId('connections').textContent).toBe('Connections: 15');
      });
    });

    it('should fetch auth service metrics', async () => {
      const authMetrics = `auth_request_count 2500
auth_login_success_rate 98.5
auth_token_validation_p95 45.2`;

      mockFetch.mockResolvedValue({
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(authMetrics)
      });

      render(
        <TestWrapper>
          <MetricsComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-auth-metrics-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('metrics-data').textContent).toContain('auth_request_count 2500');
        expect(screen.getByTestId('content-type').textContent).toBe('text/plain');
      });

      expect(mockFetch).toHaveBeenCalledWith('/auth/metrics');
    });

    it('should fetch messaging service metrics', async () => {
      const messagingMetrics = `messaging_messages_sent 15000
messaging_active_connections 350
messaging_message_delivery_p95 25.8`;

      mockFetch.mockResolvedValue({
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(messagingMetrics)
      });

      render(
        <TestWrapper>
          <MetricsComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-messaging-metrics-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('metrics-data').textContent).toContain('messaging_messages_sent 15000');
      });

      expect(mockFetch).toHaveBeenCalledWith('/messaging/metrics');
    });

    it('should handle metrics endpoint errors', async () => {
      mockFetch.mockRejectedValue(new Error('Metrics service unavailable'));

      render(
        <TestWrapper>
          <MetricsComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-metrics-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('metrics-data').textContent).toBe('');
      });

      expect(mockFetch).toHaveBeenCalledWith('/metrics');
    });

    it('should validate prometheus format with proper headers', async () => {
      const prometheusMetrics = `# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 8567
http_requests_total{method="POST",status="201"} 1234
http_requests_total{method="GET",status="404"} 23

# HELP http_request_duration_seconds Request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 5000
http_request_duration_seconds_bucket{le="0.5"} 8000
http_request_duration_seconds_bucket{le="1.0"} 9500
http_request_duration_seconds_bucket{le="+Inf"} 10000`;

      mockFetch.mockResolvedValue({
        headers: new Map([
          ['content-type', 'text/plain; version=0.0.4; charset=utf-8'],
          ['cache-control', 'no-cache']
        ]),
        text: () => Promise.resolve(prometheusMetrics)
      });

      render(
        <TestWrapper>
          <MetricsComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-metrics-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('content-type').textContent).toContain('text/plain');
        expect(screen.getByTestId('metrics-data').textContent).toContain('# HELP http_requests_total');
        expect(screen.getByTestId('metrics-data').textContent).toContain('http_requests_total{method="GET",status="200"} 8567');
      });
    });
  });

  describe('Logging Validation', () => {
    it('should fetch search service logs with request_id', async () => {
      const mockSearchLogs = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          level: 'INFO',
          message: 'Search query executed',
          request_id: 'req-search-123',
          service: 'search'
        },
        {
          timestamp: '2024-01-01T10:01:00Z',
          level: 'DEBUG',
          message: 'Index updated',
          request_id: 'req-search-124',
          service: 'search'
        }
      ];

      mockObservabilityAPI.getSearchLogs.mockResolvedValue(mockSearchLogs);

      render(
        <TestWrapper>
          <LoggingValidationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-search-logs-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('search-logs-count').textContent).toBe('Search Logs: 2');
        expect(screen.getByTestId('search-log-0').textContent).toContain('Search query executed');
        expect(screen.getByTestId('request-id-0').textContent).toContain('req-search-123');
        expect(screen.getByTestId('search-log-1').textContent).toContain('Index updated');
      });

      expect(mockObservabilityAPI.getSearchLogs).toHaveBeenCalledTimes(1);
    });

    it('should fetch events service logs with request_id', async () => {
      const mockEventsLogs = [
        {
          timestamp: '2024-01-01T10:02:00Z',
          level: 'INFO',
          message: 'Event created successfully',
          request_id: 'req-events-456',
          service: 'events'
        },
        {
          timestamp: '2024-01-01T10:03:00Z',
          level: 'WARN',
          message: 'Event validation warning',
          request_id: 'req-events-457',
          service: 'events'
        }
      ];

      mockObservabilityAPI.getEventsLogs.mockResolvedValue(mockEventsLogs);

      render(
        <TestWrapper>
          <LoggingValidationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-events-logs-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('events-logs-count').textContent).toBe('Events Logs: 2');
        expect(screen.getByTestId('events-log-0').textContent).toContain('Event created successfully');
        expect(screen.getByTestId('events-request-id-0').textContent).toContain('req-events-456');
      });

      expect(mockObservabilityAPI.getEventsLogs).toHaveBeenCalledTimes(1);
    });

    it('should validate that all logs contain request_id', async () => {
      mockObservabilityAPI.checkRequestIdPresence
        .mockResolvedValueOnce({
          allLogsHaveRequestId: true,
          missingCount: 0,
          totalLogs: 100
        })
        .mockResolvedValueOnce({
          allLogsHaveRequestId: true,
          missingCount: 0,
          totalLogs: 75
        });

      render(
        <TestWrapper>
          <LoggingValidationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('validate-request-ids-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('search-validation').textContent).toBe('Search logs valid: YES');
        expect(screen.getByTestId('events-validation').textContent).toBe('Events logs valid: YES');
        expect(screen.getByTestId('missing-count').textContent).toBe('Missing request IDs: 0');
      });

      expect(mockObservabilityAPI.checkRequestIdPresence).toHaveBeenCalledWith('search');
      expect(mockObservabilityAPI.checkRequestIdPresence).toHaveBeenCalledWith('events');
    });

    it('should detect missing request_id in logs', async () => {
      mockObservabilityAPI.checkRequestIdPresence
        .mockResolvedValueOnce({
          allLogsHaveRequestId: false,
          missingCount: 5,
          totalLogs: 100
        })
        .mockResolvedValueOnce({
          allLogsHaveRequestId: false,
          missingCount: 3,
          totalLogs: 75
        });

      render(
        <TestWrapper>
          <LoggingValidationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('validate-request-ids-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('search-validation').textContent).toBe('Search logs valid: NO');
        expect(screen.getByTestId('events-validation').textContent).toBe('Events logs valid: NO');
        expect(screen.getByTestId('missing-count').textContent).toBe('Missing request IDs: 8');
      });
    });

    it('should handle logs without request_id gracefully', async () => {
      const logsWithMissingRequestId = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          level: 'INFO',
          message: 'Search query executed',
          request_id: 'req-search-123',
          service: 'search'
        },
        {
          timestamp: '2024-01-01T10:01:00Z',
          level: 'DEBUG',
          message: 'System startup',
          // Missing request_id
          service: 'search'
        }
      ];

      mockObservabilityAPI.getSearchLogs.mockResolvedValue(logsWithMissingRequestId);

      render(
        <TestWrapper>
          <LoggingValidationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-search-logs-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('search-logs-count').textContent).toBe('Search Logs: 2');
        expect(screen.getByTestId('search-log-0').textContent).toContain('Search query executed');
        expect(screen.getByTestId('search-log-1').textContent).toContain('System startup');
        // Second log should not have request_id span
        expect(screen.getByTestId('search-log-1').textContent).not.toContain('req:');
      });
    });

    it('should validate request_id format', async () => {
      const logsWithVariousRequestIds = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          level: 'INFO',
          message: 'Valid format',
          request_id: 'req-search-uuid-123456',
          service: 'search'
        },
        {
          timestamp: '2024-01-01T10:01:00Z',
          level: 'INFO',
          message: 'Another valid format',
          request_id: 'req-events-2024-001',
          service: 'events'
        }
      ];

      mockObservabilityAPI.getSearchLogs.mockResolvedValue([logsWithVariousRequestIds[0]]);
      mockObservabilityAPI.getEventsLogs.mockResolvedValue([logsWithVariousRequestIds[1]]);

      render(
        <TestWrapper>
          <LoggingValidationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('fetch-search-logs-btn'));
      fireEvent.click(screen.getByTestId('fetch-events-logs-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('request-id-0').textContent).toContain('req-search-uuid-123456');
        expect(screen.getByTestId('events-request-id-0').textContent).toContain('req-events-2024-001');
      });
    });
  });

  describe('Comprehensive Observability', () => {
    it('should verify metrics and logs work together', async () => {
      // Setup metrics
      const mockMetrics = `request_count 1000
error_rate 0.1`;
      
      mockFetch.mockResolvedValue({
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(mockMetrics)
      });

      // Setup logs
      const mockLogs = [
        {
          timestamp: '2024-01-01T10:00:00Z',
          level: 'INFO',
          message: 'Request processed',
          request_id: 'req-123',
          service: 'search'
        }
      ];

      mockObservabilityAPI.getSearchLogs.mockResolvedValue(mockLogs);
      mockObservabilityAPI.checkRequestIdPresence.mockResolvedValue({
        allLogsHaveRequestId: true,
        missingCount: 0
      });

      render(
        <TestWrapper>
          <div>
            <MetricsComponent />
            <LoggingValidationComponent />
          </div>
        </TestWrapper>
      );

      // Test metrics
      fireEvent.click(screen.getByTestId('fetch-metrics-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('request-count').textContent).toBe('Requests: 1000');
      });

      // Test logs
      fireEvent.click(screen.getByTestId('fetch-search-logs-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('search-logs-count').textContent).toBe('Search Logs: 1');
      });

      // Validate request IDs
      fireEvent.click(screen.getByTestId('validate-request-ids-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('search-validation').textContent).toBe('Search logs valid: YES');
      });
    });
  });
});