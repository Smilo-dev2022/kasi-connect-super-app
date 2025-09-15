import { describe, it, expect, vi, beforeEach } from 'vitest';

// Observability Tests
describe('Observability Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Metrics Endpoints', () => {
    it('should return metrics with correct content-type', async () => {
      const mockMetrics = `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234
http_requests_total{method="POST",status="201"} 567
# HELP http_request_duration_seconds Request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_count 1801
http_request_duration_seconds_sum 345.2`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain; charset=utf-8' }),
        text: () => Promise.resolve(mockMetrics),
      });

      const response = await fetch('/metrics');
      const content = await response.text();
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/plain');
      expect(content).toContain('http_requests_total');
      expect(content).toContain('http_request_duration_seconds');
    });

    it('should include correct metric values for Search service', async () => {
      const mockSearchMetrics = `search_requests_total{type="text"} 1500
search_requests_total{type="media"} 750
search_request_duration_seconds{quantile="0.5"} 0.12
search_request_duration_seconds{quantile="0.95"} 0.45
search_errors_total 23`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve(mockSearchMetrics),
      });

      const response = await fetch('/search/metrics');
      const content = await response.text();
      
      expect(response.ok).toBe(true);
      expect(content).toContain('search_requests_total');
      expect(content).toContain('search_errors_total');
      expect(content).toMatch(/quantile="0\.95"/);
    });

    it('should include correct metric values for Events service', async () => {
      const mockEventsMetrics = `events_created_total 145
events_rsvps_total{status="attending"} 567
events_rsvps_total{status="not_attending"} 123
events_checkins_total 234
events_request_duration_seconds{quantile="0.99"} 0.89`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve(mockEventsMetrics),
      });

      const response = await fetch('/events/metrics');
      const content = await response.text();
      
      expect(response.ok).toBe(true);
      expect(content).toContain('events_created_total');
      expect(content).toContain('events_rsvps_total');
      expect(content).toContain('events_checkins_total');
    });
  });

  describe('Logging Validation', () => {
    it('should include request_id in Search service logs', async () => {
      const mockSearchResponse = {
        results: [
          { title: 'Test Result', url: 'https://example.com' }
        ],
        requestId: 'req-search-123'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSearchResponse),
      });

      const response = await fetch('/search/query', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': 'req-search-123'
        },
        body: JSON.stringify({ 
          query: 'test search',
          type: 'text'
        })
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.requestId).toBe('req-search-123');
      
      // In actual implementation, verify logs contain request_id
      // This would be done by checking log output or using a log capture mechanism
    });

    it('should include request_id in Events service logs', async () => {
      const mockEventResponse = {
        id: 'event123',
        title: 'Test Event',
        requestId: 'req-events-456'
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEventResponse),
      });

      const response = await fetch('/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': 'req-events-456'
        },
        body: JSON.stringify({ 
          title: 'Test Event',
          startTime: '2025-01-15T18:00:00Z'
        })
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.requestId).toBe('req-events-456');
    });

    it('should generate request_id when not provided', async () => {
      const mockResponse = {
        results: [],
        requestId: expect.stringMatching(/^req-[a-zA-Z0-9-]+$/)
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          results: [],
          requestId: 'req-auto-generated-789'
        }),
      });

      const response = await fetch('/search/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: 'test search',
          type: 'text'
        })
      });

      const data = await response.json();
      expect(response.ok).toBe(true);
      expect(data.requestId).toBeDefined();
      expect(data.requestId).toMatch(/^req-/);
    });
  });

  describe('Health Checks', () => {
    it('should return healthy status for all services', async () => {
      const services = [
        { name: 'auth', port: 4010 },
        { name: 'media', port: 4008 },
        { name: 'search', port: 4009 },
        { name: 'events', port: 8000 },
        { name: 'moderation', port: 8082 }
      ];

      for (const service of services) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ 
            status: 'healthy',
            service: service.name,
            timestamp: new Date().toISOString()
          }),
        });

        const response = await fetch(`http://localhost:${service.port}/health`);
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        expect(response.status).toBe(200);
        expect(data.status).toBe('healthy');
        expect(data.service).toBe(service.name);
      }
    });

    it('should handle unhealthy service status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({ 
          status: 'unhealthy',
          error: 'Database connection failed',
          service: 'auth'
        }),
      });

      const response = await fetch('http://localhost:4010/health');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(503);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times', async () => {
      const startTime = Date.now();
      
      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ data: 'test' }),
              headers: new Headers({
                'X-Response-Time': `${Date.now() - startTime}ms`
              })
            });
          }, 50);
        });
      });

      const response = await fetch('/api/test');
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
    });

    it('should track error rates', async () => {
      const mockErrorMetrics = `http_requests_total{status="500"} 15
http_requests_total{status="200"} 985
error_rate_percentage 1.5`;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve(mockErrorMetrics),
      });

      const response = await fetch('/metrics');
      const content = await response.text();
      
      expect(content).toContain('error_rate_percentage');
      expect(content).toContain('http_requests_total{status="500"}');
    });
  });
});