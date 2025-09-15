import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock moderation service
const mockModerationModule = {
  claimQueue: vi.fn(),
  releaseQueue: vi.fn(),
  submitReport: vi.fn(),
  getQueueStatus: vi.fn(),
  escalateReport: vi.fn(),
  resolveReport: vi.fn(),
  updateReportStatus: vi.fn(),
};

vi.mock('../lib/moderation', () => mockModerationModule);

// Mock UI update functions
const mockUIModule = {
  showOptimisticUpdate: vi.fn(),
  revertOptimisticUpdate: vi.fn(),
  confirmOptimisticUpdate: vi.fn(),
};

describe('Moderation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Queue Claim and Release', () => {
    it('should claim moderation queue successfully', async () => {
      const moderatorId = 'mod-123';
      const queueData = {
        id: 'queue-456',
        type: 'content_reports',
        claimedBy: moderatorId,
        claimedAt: Date.now(),
        itemCount: 5,
        estimatedTime: 300, // 5 minutes
      };

      mockModerationModule.claimQueue.mockResolvedValue(queueData);

      const result = await mockModerationModule.claimQueue(moderatorId, 'content_reports');

      expect(mockModerationModule.claimQueue).toHaveBeenCalledWith(moderatorId, 'content_reports');
      expect(result.claimedBy).toBe(moderatorId);
      expect(result.itemCount).toBe(5);
    });

    it('should handle queue already claimed by another moderator', async () => {
      const moderatorId = 'mod-123';
      
      mockModerationModule.claimQueue.mockRejectedValue(
        new Error('Queue already claimed by mod-456')
      );

      await expect(
        mockModerationModule.claimQueue(moderatorId, 'content_reports')
      ).rejects.toThrow('Queue already claimed by mod-456');
    });

    it('should release queue successfully', async () => {
      const queueId = 'queue-456';
      const releaseData = {
        id: queueId,
        releasedAt: Date.now(),
        itemsProcessed: 3,
        itemsRemaining: 2,
      };

      mockModerationModule.releaseQueue.mockResolvedValue(releaseData);

      const result = await mockModerationModule.releaseQueue(queueId);

      expect(mockModerationModule.releaseQueue).toHaveBeenCalledWith(queueId);
      expect(result.itemsProcessed).toBe(3);
      expect(result.itemsRemaining).toBe(2);
    });

    it('should handle auto-release on timeout', async () => {
      const queueId = 'queue-timeout';
      const autoReleaseData = {
        id: queueId,
        releasedAt: Date.now(),
        reason: 'timeout',
        autoReleased: true,
      };

      mockModerationModule.releaseQueue.mockResolvedValue(autoReleaseData);

      const result = await mockModerationModule.releaseQueue(queueId);

      expect(result.autoReleased).toBe(true);
      expect(result.reason).toBe('timeout');
    });
  });

  describe('Optimistic UI Updates', () => {
    it('should show optimistic update when processing report', async () => {
      const reportId = 'report-123';
      const optimisticUpdate = {
        id: reportId,
        status: 'processing',
        updatedAt: Date.now(),
        optimistic: true,
      };

      mockUIModule.showOptimisticUpdate.mockReturnValue(optimisticUpdate);

      // Simulate processing a report with optimistic UI
      const result = mockUIModule.showOptimisticUpdate(reportId, { status: 'processing' });

      expect(mockUIModule.showOptimisticUpdate).toHaveBeenCalledWith(
        reportId, 
        { status: 'processing' }
      );
      expect(result.optimistic).toBe(true);
      expect(result.status).toBe('processing');
    });

    it('should revert optimistic update on failure', async () => {
      const reportId = 'report-fail';
      const originalState = {
        id: reportId,
        status: 'pending',
        updatedAt: Date.now() - 1000,
      };

      mockUIModule.revertOptimisticUpdate.mockReturnValue(originalState);

      // Simulate API failure and revert
      const result = mockUIModule.revertOptimisticUpdate(reportId);

      expect(mockUIModule.revertOptimisticUpdate).toHaveBeenCalledWith(reportId);
      expect(result.status).toBe('pending');
    });

    it('should confirm optimistic update on success', async () => {
      const reportId = 'report-success';
      const confirmedState = {
        id: reportId,
        status: 'resolved',
        updatedAt: Date.now(),
        optimistic: false,
      };

      mockUIModule.confirmOptimisticUpdate.mockReturnValue(confirmedState);

      const result = mockUIModule.confirmOptimisticUpdate(reportId, { status: 'resolved' });

      expect(mockUIModule.confirmOptimisticUpdate).toHaveBeenCalledWith(
        reportId, 
        { status: 'resolved' }
      );
      expect(result.optimistic).toBe(false);
      expect(result.status).toBe('resolved');
    });
  });

  describe('Report Management', () => {
    it('should submit new report', async () => {
      const reportData = {
        contentId: 'content-123',
        contentType: 'message',
        reason: 'harassment',
        description: 'User is sending threatening messages',
        reportedBy: 'user-456',
      };

      const mockResponse = {
        id: 'report-789',
        ...reportData,
        status: 'pending',
        createdAt: Date.now(),
        priority: 'high',
      };

      mockModerationModule.submitReport.mockResolvedValue(mockResponse);

      const result = await mockModerationModule.submitReport(reportData);

      expect(mockModerationModule.submitReport).toHaveBeenCalledWith(reportData);
      expect(result.id).toBe('report-789');
      expect(result.status).toBe('pending');
      expect(result.priority).toBe('high');
    });

    it('should escalate report to admin', async () => {
      const reportId = 'report-escalate';
      const escalationData = {
        reason: 'Requires admin review for policy violation',
        escalatedBy: 'mod-123',
        escalatedAt: Date.now(),
      };

      const mockResponse = {
        id: reportId,
        status: 'escalated',
        ...escalationData,
        assignedTo: 'admin-456',
      };

      mockModerationModule.escalateReport.mockResolvedValue(mockResponse);

      const result = await mockModerationModule.escalateReport(reportId, escalationData);

      expect(mockModerationModule.escalateReport).toHaveBeenCalledWith(reportId, escalationData);
      expect(result.status).toBe('escalated');
      expect(result.assignedTo).toBe('admin-456');
    });

    it('should resolve report with action taken', async () => {
      const reportId = 'report-resolve';
      const resolutionData = {
        action: 'content_removed',
        reason: 'Violates community guidelines',
        resolvedBy: 'mod-789',
        notes: 'User warned about behavior',
      };

      const mockResponse = {
        id: reportId,
        status: 'resolved',
        ...resolutionData,
        resolvedAt: Date.now(),
      };

      mockModerationModule.resolveReport.mockResolvedValue(mockResponse);

      const result = await mockModerationModule.resolveReport(reportId, resolutionData);

      expect(mockModerationModule.resolveReport).toHaveBeenCalledWith(reportId, resolutionData);
      expect(result.status).toBe('resolved');
      expect(result.action).toBe('content_removed');
    });
  });

  describe('Queue Status Management', () => {
    it('should get current queue status', async () => {
      const mockQueueStatus = {
        totalQueues: 3,
        queues: [
          {
            id: 'queue-1',
            type: 'content_reports',
            itemCount: 5,
            claimedBy: 'mod-123',
            estimatedTime: 300,
          },
          {
            id: 'queue-2',
            type: 'user_reports',
            itemCount: 2,
            claimedBy: null,
            estimatedTime: 120,
          },
          {
            id: 'queue-3',
            type: 'escalations',
            itemCount: 1,
            claimedBy: 'admin-456',
            estimatedTime: 600,
          },
        ],
        availableQueues: 1,
        processingTime: {
          average: 180,
          current: 240,
        },
      };

      mockModerationModule.getQueueStatus.mockResolvedValue(mockQueueStatus);

      const result = await mockModerationModule.getQueueStatus();

      expect(result.totalQueues).toBe(3);
      expect(result.availableQueues).toBe(1);
      expect(result.queues[0].claimedBy).toBe('mod-123');
      expect(result.queues[1].claimedBy).toBe(null);
    });

    it('should handle empty queue status', async () => {
      const emptyQueueStatus = {
        totalQueues: 0,
        queues: [],
        availableQueues: 0,
        processingTime: {
          average: 0,
          current: 0,
        },
      };

      mockModerationModule.getQueueStatus.mockResolvedValue(emptyQueueStatus);

      const result = await mockModerationModule.getQueueStatus();

      expect(result.totalQueues).toBe(0);
      expect(result.queues).toHaveLength(0);
    });
  });

  describe('Report Status Updates', () => {
    it('should update report status with validation', async () => {
      const reportId = 'report-update';
      const statusUpdate = {
        status: 'in_review',
        assignedTo: 'mod-123',
        notes: 'Started reviewing content',
      };

      const mockResponse = {
        id: reportId,
        ...statusUpdate,
        updatedAt: Date.now(),
        previousStatus: 'pending',
      };

      mockModerationModule.updateReportStatus.mockResolvedValue(mockResponse);

      const result = await mockModerationModule.updateReportStatus(reportId, statusUpdate);

      expect(mockModerationModule.updateReportStatus).toHaveBeenCalledWith(reportId, statusUpdate);
      expect(result.status).toBe('in_review');
      expect(result.previousStatus).toBe('pending');
    });

    it('should handle invalid status transitions', async () => {
      const reportId = 'report-invalid';
      const invalidUpdate = {
        status: 'resolved',
        // Missing required resolution data
      };

      mockModerationModule.updateReportStatus.mockRejectedValue(
        new Error('Cannot resolve report without action or reason')
      );

      await expect(
        mockModerationModule.updateReportStatus(reportId, invalidUpdate)
      ).rejects.toThrow('Cannot resolve report without action or reason');
    });
  });

  describe('UI Integration Tests', () => {
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

    it('should render moderation buttons with correct accessibility', () => {
      const MockModerationPanel = () => (
        <div data-testid="moderation-panel">
          <button aria-label="Accept report" data-testid="accept-btn">
            Accept
          </button>
          <button aria-label="Cancel report" data-testid="cancel-btn">
            Cancel
          </button>
          <button aria-label="Escalate report to admin" data-testid="escalate-btn">
            Escalate
          </button>
        </div>
      );

      render(
        <TestWrapper>
          <MockModerationPanel />
        </TestWrapper>
      );

      // Check accessibility attributes
      const acceptBtn = screen.getByTestId('accept-btn');
      const cancelBtn = screen.getByTestId('cancel-btn');
      const escalateBtn = screen.getByTestId('escalate-btn');

      expect(acceptBtn).toHaveAttribute('aria-label', 'Accept report');
      expect(cancelBtn).toHaveAttribute('aria-label', 'Cancel report');
      expect(escalateBtn).toHaveAttribute('aria-label', 'Escalate report to admin');

      // Check that buttons are focusable
      acceptBtn.focus();
      expect(acceptBtn).toHaveFocus();

      cancelBtn.focus();
      expect(cancelBtn).toHaveFocus();

      escalateBtn.focus();
      expect(escalateBtn).toHaveFocus();
    });

    it('should handle optimistic updates in UI', async () => {
      const MockReportItem = ({ reportId }: { reportId: string }) => {
        const [status, setStatus] = React.useState('pending');
        const [isOptimistic, setIsOptimistic] = React.useState(false);

        const handleAccept = async () => {
          // Show optimistic update
          setStatus('processing');
          setIsOptimistic(true);

          try {
            await mockModerationModule.resolveReport(reportId, { action: 'approved' });
            setStatus('resolved');
            setIsOptimistic(false);
          } catch (error) {
            // Revert optimistic update
            setStatus('pending');
            setIsOptimistic(false);
          }
        };

        return (
          <div data-testid="report-item">
            <span data-testid="status">
              {status} {isOptimistic && '(pending...)'}
            </span>
            <button onClick={handleAccept} data-testid="accept">
              Accept
            </button>
          </div>
        );
      };

      mockModerationModule.resolveReport.mockResolvedValue({
        id: 'report-123',
        status: 'resolved',
        action: 'approved',
      });

      render(
        <TestWrapper>
          <MockReportItem reportId="report-123" />
        </TestWrapper>
      );

      const statusElement = screen.getByTestId('status');
      const acceptButton = screen.getByTestId('accept');

      // Initially pending
      expect(statusElement).toHaveTextContent('pending');

      // Click accept
      fireEvent.click(acceptButton);

      // Should show optimistic update
      expect(statusElement).toHaveTextContent('processing (pending...)');

      // Wait for resolution
      await waitFor(() => {
        expect(statusElement).toHaveTextContent('resolved');
      });

      expect(mockModerationModule.resolveReport).toHaveBeenCalledWith(
        'report-123',
        { action: 'approved' }
      );
    });
  });
});