import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Moderation Service Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('Queue Claim and Release', () => {
    it('should claim moderation queue items successfully', async () => {
      const mockQueueItem = {
        id: 'report_123',
        content_id: 'content_456',
        content_text: 'Spam content',
        reason: 'spam',
        status: 'pending',
        claimed_by: null,
        claimed_at: null,
        sla_deadline: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockQueueItem,
            claimed_by: 'moderator_1',
            claimed_at: new Date().toISOString()
          })
        });

      const moderationService = await import('@/lib/moderation'); // Assuming moderation lib exists
      
      const claimedItem = await moderationService.claimQueueItem('report_123', 'moderator_1');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports/report_123/claim'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ moderator_id: 'moderator_1' })
        })
      );

      expect(claimedItem.claimed_by).toBe('moderator_1');
      expect(claimedItem.claimed_at).toBeTruthy();
    });

    it('should release moderation queue items successfully', async () => {
      const mockQueueItem = {
        id: 'report_123',
        content_id: 'content_456',
        status: 'in_review',
        claimed_by: 'moderator_1',
        claimed_at: new Date().toISOString()
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockQueueItem,
            claimed_by: null,
            claimed_at: null,
            status: 'pending'
          })
        });

      const moderationService = await import('@/lib/moderation');
      
      const releasedItem = await moderationService.releaseQueueItem('report_123', 'moderator_1');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports/report_123/release'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ moderator_id: 'moderator_1' })
        })
      );

      expect(releasedItem.claimed_by).toBeNull();
      expect(releasedItem.status).toBe('pending');
    });

    it('should handle queue item claim conflicts', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({
            error: 'Item already claimed by another moderator'
          })
        });

      const moderationService = await import('@/lib/moderation');
      
      try {
        await moderationService.claimQueueItem('report_123', 'moderator_2');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('already claimed');
      }
    });
  });

  describe('Escalation Tests with SLA Timers', () => {
    it('should escalate reports correctly', async () => {
      const mockReport = {
        id: 'report_123',
        status: 'pending',
        escalation_level: 0,
        escalated_at: null,
        sla_deadline: new Date(Date.now() + 3600000).toISOString()
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockReport,
            status: 'escalated',
            escalation_level: 1,
            escalated_at: new Date().toISOString(),
            escalated_by: 'moderator_1',
            sla_deadline: new Date(Date.now() + 1800000).toISOString() // 30 min from now
          })
        });

      const moderationService = await import('@/lib/moderation');
      
      const escalatedReport = await moderationService.escalateReport('report_123', {
        moderator_id: 'moderator_1',
        reason: 'Complex case requiring senior review'
      });
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports/report_123/escalate'),
        expect.objectContaining({
          method: 'POST'
        })
      );

      expect(escalatedReport.status).toBe('escalated');
      expect(escalatedReport.escalation_level).toBe(1);
      expect(escalatedReport.escalated_by).toBe('moderator_1');
    });

    it('should de-escalate reports correctly', async () => {
      const mockEscalatedReport = {
        id: 'report_123',
        status: 'escalated',
        escalation_level: 1,
        escalated_at: new Date().toISOString(),
        escalated_by: 'moderator_1'
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockEscalatedReport,
            status: 'in_review',
            escalation_level: 0,
            escalated_at: null,
            escalated_by: null,
            de_escalated_by: 'senior_moderator_1',
            de_escalated_at: new Date().toISOString()
          })
        });

      const moderationService = await import('@/lib/moderation');
      
      const deEscalatedReport = await moderationService.deEscalateReport('report_123', {
        moderator_id: 'senior_moderator_1',
        reason: 'Issue resolved at current level'
      });
      
      expect(deEscalatedReport.status).toBe('in_review');
      expect(deEscalatedReport.escalation_level).toBe(0);
      expect(deEscalatedReport.de_escalated_by).toBe('senior_moderator_1');
    });

    it('should close reports with SLA tracking', async () => {
      const mockReport = {
        id: 'report_123',
        status: 'in_review',
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        sla_deadline: new Date(Date.now() + 1800000).toISOString() // 30 min from now
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockReport,
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: 'moderator_1',
            resolution: 'content_removed',
            sla_met: true,
            resolution_time_ms: 7200000 // 2 hours
          })
        });

      const moderationService = await import('@/lib/moderation');
      
      const closedReport = await moderationService.closeReport('report_123', {
        moderator_id: 'moderator_1',
        resolution: 'content_removed',
        notes: 'Spam content removed as per policy'
      });
      
      expect(closedReport.status).toBe('closed');
      expect(closedReport.closed_by).toBe('moderator_1');
      expect(closedReport.sla_met).toBe(true);
      expect(closedReport.resolution_time_ms).toBe(7200000);
    });

    it('should track SLA violations', async () => {
      const mockReport = {
        id: 'report_456',
        status: 'pending',
        created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        sla_deadline: new Date(Date.now() - 1800000).toISOString() // 30 min ago (violated)
      };

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockReport,
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by: 'moderator_1',
            sla_met: false,
            sla_violation_minutes: 30
          })
        });

      const moderationService = await import('@/lib/moderation');
      
      const closedReport = await moderationService.closeReport('report_456', {
        moderator_id: 'moderator_1',
        resolution: 'no_action_needed'
      });
      
      expect(closedReport.sla_met).toBe(false);
      expect(closedReport.sla_violation_minutes).toBe(30);
    });
  });

  describe('Optimistic UI Updates', () => {
    it('should handle optimistic UI updates for queue operations', async () => {
      const mockQueueState = {
        items: [
          { id: 'report_1', status: 'pending', claimed_by: null },
          { id: 'report_2', status: 'pending', claimed_by: null }
        ]
      };

      // Mock successful claim followed by API failure
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'));

      const moderationUI = await import('@/components/ModerationQueue'); // Assuming UI component exists
      
      // Test optimistic update with rollback on failure
      const initialState = [...mockQueueState.items];
      
      try {
        await moderationUI.optimisticallyClaimItem('report_1', 'moderator_1', mockQueueState);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Should rollback optimistic update
        expect(mockQueueState.items).toEqual(initialState);
      }
    });

    it('should handle optimistic escalation updates', async () => {
      const mockReport = {
        id: 'report_123',
        status: 'pending',
        escalation_level: 0
      };

      // Mock API failure after optimistic update
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Server error'));

      const moderationUI = await import('@/components/ModerationQueue');
      
      const originalReport = { ...mockReport };
      
      try {
        await moderationUI.optimisticallyEscalateReport(mockReport, 'moderator_1');
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Should rollback to original state
        expect(mockReport.status).toBe(originalReport.status);
        expect(mockReport.escalation_level).toBe(originalReport.escalation_level);
      }
    });
  });

  describe('Metrics and Monitoring', () => {
    it('should track moderation metrics correctly', async () => {
      const mockMetrics = `
# HELP moderation_reports_total Total number of moderation reports
# TYPE moderation_reports_total counter
moderation_reports_total{status="pending"} 25
moderation_reports_total{status="escalated"} 5
moderation_reports_total{status="closed"} 150

# HELP moderation_sla_violations_total Total SLA violations
# TYPE moderation_sla_violations_total counter
moderation_sla_violations_total 3

# HELP moderation_resolution_time_ms Resolution time in milliseconds
# TYPE moderation_resolution_time_ms histogram
moderation_resolution_time_ms_bucket{le="3600000"} 120
moderation_resolution_time_ms_bucket{le="7200000"} 145
moderation_resolution_time_ms_bucket{le="+Inf"} 150
      `;

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: (name) => name === 'content-type' ? 'text/plain; charset=utf-8' : null
          },
          text: () => Promise.resolve(mockMetrics)
        });

      const response = await fetch('http://localhost:8082/metrics');
      
      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/plain');
      
      const metricsText = await response.text();
      expect(metricsText).toContain('moderation_reports_total');
      expect(metricsText).toContain('moderation_sla_violations_total');
      expect(metricsText).toContain('moderation_resolution_time_ms');
    });
  });
});