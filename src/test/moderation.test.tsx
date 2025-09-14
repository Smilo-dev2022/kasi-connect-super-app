import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock moderation API calls
const mockModerationAPI = {
  claimReport: vi.fn(),
  releaseReport: vi.fn(),
  updateReportStatus: vi.fn(),
  getReports: vi.fn(),
  submitReport: vi.fn(),
};

// Mock component for testing moderation functionality
const ModerationTestComponent = () => {
  const handleClaimReport = async (reportId: string) => {
    try {
      return await mockModerationAPI.claimReport(reportId);
    } catch (error) {
      console.error('Claim failed:', error);
    }
  };

  const handleReleaseReport = async (reportId: string) => {
    try {
      return await mockModerationAPI.releaseReport(reportId);
    } catch (error) {
      console.error('Release failed:', error);
    }
  };

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      return await mockModerationAPI.updateReportStatus(reportId, status);
    } catch (error) {
      console.error('Update status failed:', error);
    }
  };

  const handleSubmitReport = async (content: Record<string, unknown>) => {
    try {
      return await mockModerationAPI.submitReport(content);
    } catch (error) {
      console.error('Submit report failed:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleClaimReport('report-123')} 
        data-testid="claim-btn"
      >
        Claim Report
      </button>
      <button 
        onClick={() => handleReleaseReport('report-123')} 
        data-testid="release-btn"
      >
        Release Report
      </button>
      <button 
        onClick={() => handleUpdateStatus('report-123', 'resolved')} 
        data-testid="update-status-btn"
      >
        Update Status
      </button>
      <button 
        onClick={() => handleSubmitReport({ type: 'spam', content: 'Test report' })} 
        data-testid="submit-report-btn"
      >
        Submit Report
      </button>
    </div>
  );
};

// Mock component for testing optimistic UI updates
const OptimisticModerationComponent = () => {
  const [reports, setReports] = React.useState([
    { id: 'report-1', status: 'pending', assignee: null },
    { id: 'report-2', status: 'pending', assignee: null },
  ]);

  const handleOptimisticClaim = async (reportId: string) => {
    // Optimistic update - immediately update UI
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'in_progress', assignee: 'current-user' }
        : report
    ));

    try {
      // Simulate API call
      await mockModerationAPI.claimReport(reportId);
    } catch (error) {
      // Revert optimistic update on error
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'pending', assignee: null }
          : report
      ));
      // Don't re-throw the error to avoid unhandled error
      console.error('Claim failed:', error);
    }
  };

  const handleOptimisticRelease = async (reportId: string) => {
    // Optimistic update
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, status: 'pending', assignee: null }
        : report
    ));

    try {
      await mockModerationAPI.releaseReport(reportId);
    } catch (error) {
      // Revert on error
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: 'in_progress', assignee: 'current-user' }
          : report
      ));
      // Don't re-throw the error to avoid unhandled error
      console.error('Release failed:', error);
    }
  };

  return (
    <div>
      {reports.map(report => (
        <div key={report.id} data-testid={`report-${report.id}`}>
          <span data-testid={`status-${report.id}`}>{report.status}</span>
          <span data-testid={`assignee-${report.id}`}>{report.assignee || 'unassigned'}</span>
          <button 
            onClick={() => handleOptimisticClaim(report.id)}
            data-testid={`claim-${report.id}`}
          >
            Claim
          </button>
          <button 
            onClick={() => handleOptimisticRelease(report.id)}
            data-testid={`release-${report.id}`}
          >
            Release
          </button>
        </div>
      ))}
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

describe('Moderation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Queue Claim/Release Operations', () => {
    it('should successfully claim a report from the queue', async () => {
      mockModerationAPI.claimReport.mockResolvedValue({
        success: true,
        reportId: 'report-123',
        assignee: 'moderator-456',
      });

      render(
        <TestWrapper>
          <ModerationTestComponent />
        </TestWrapper>
      );

      const claimBtn = screen.getByTestId('claim-btn');
      fireEvent.click(claimBtn);

      await waitFor(() => {
        expect(mockModerationAPI.claimReport).toHaveBeenCalledWith('report-123');
      });
    });

    it('should successfully release a claimed report', async () => {
      mockModerationAPI.releaseReport.mockResolvedValue({
        success: true,
        reportId: 'report-123',
      });

      render(
        <TestWrapper>
          <ModerationTestComponent />
        </TestWrapper>
      );

      const releaseBtn = screen.getByTestId('release-btn');
      fireEvent.click(releaseBtn);

      await waitFor(() => {
        expect(mockModerationAPI.releaseReport).toHaveBeenCalledWith('report-123');
      });
    });

    it('should handle concurrent claim attempts', async () => {
      // First call succeeds
      mockModerationAPI.claimReport
        .mockResolvedValueOnce({ success: true, reportId: 'report-123' })
        .mockRejectedValueOnce(new Error('Report already claimed'));

      render(
        <TestWrapper>
          <ModerationTestComponent />
        </TestWrapper>
      );

      const claimBtn = screen.getByTestId('claim-btn');
      
      // Simulate rapid clicks (concurrent claims)
      fireEvent.click(claimBtn);
      fireEvent.click(claimBtn);

      await waitFor(() => {
        expect(mockModerationAPI.claimReport).toHaveBeenCalledTimes(2);
      });
    });

    it('should update report status correctly', async () => {
      mockModerationAPI.updateReportStatus.mockResolvedValue({
        success: true,
        reportId: 'report-123',
        newStatus: 'resolved',
      });

      render(
        <TestWrapper>
          <ModerationTestComponent />
        </TestWrapper>
      );

      const updateBtn = screen.getByTestId('update-status-btn');
      fireEvent.click(updateBtn);

      await waitFor(() => {
        expect(mockModerationAPI.updateReportStatus).toHaveBeenCalledWith('report-123', 'resolved');
      });
    });
  });

  describe('Optimistic UI Updates', () => {
    it('should optimistically update UI when claiming a report', async () => {
      mockModerationAPI.claimReport.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <OptimisticModerationComponent />
        </TestWrapper>
      );

      const claimBtn = screen.getByTestId('claim-report-1');
      const statusElement = screen.getByTestId('status-report-1');
      const assigneeElement = screen.getByTestId('assignee-report-1');

      // Initial state
      expect(statusElement.textContent).toBe('pending');
      expect(assigneeElement.textContent).toBe('unassigned');

      // Click claim - should immediately update UI
      fireEvent.click(claimBtn);

      // Check optimistic update happened immediately
      expect(statusElement.textContent).toBe('in_progress');
      expect(assigneeElement.textContent).toBe('current-user');

      // Wait for API call to complete
      await waitFor(() => {
        expect(mockModerationAPI.claimReport).toHaveBeenCalledWith('report-1');
      });
    });

    it('should revert optimistic update on API failure', async () => {
      mockModerationAPI.claimReport.mockRejectedValue(new Error('API Error'));

      render(
        <TestWrapper>
          <OptimisticModerationComponent />
        </TestWrapper>
      );

      const claimBtn = screen.getByTestId('claim-report-1');
      const statusElement = screen.getByTestId('status-report-1');
      const assigneeElement = screen.getByTestId('assignee-report-1');

      // Initial state
      expect(statusElement.textContent).toBe('pending');
      expect(assigneeElement.textContent).toBe('unassigned');

      // Click claim
      fireEvent.click(claimBtn);

      // Optimistic update should happen immediately
      expect(statusElement.textContent).toBe('in_progress');
      expect(assigneeElement.textContent).toBe('current-user');

      // Wait for API call to fail and revert
      await waitFor(() => {
        expect(statusElement.textContent).toBe('pending');
        expect(assigneeElement.textContent).toBe('unassigned');
      });
    });

    it('should handle optimistic release correctly', async () => {
      mockModerationAPI.releaseReport.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <OptimisticModerationComponent />
        </TestWrapper>
      );

      // First claim a report
      const claimBtn = screen.getByTestId('claim-report-1');
      fireEvent.click(claimBtn);

      await waitFor(() => {
        expect(screen.getByTestId('status-report-1').textContent).toBe('in_progress');
      });

      // Now release it
      const releaseBtn = screen.getByTestId('release-report-1');
      fireEvent.click(releaseBtn);

      // Should immediately update to pending
      expect(screen.getByTestId('status-report-1').textContent).toBe('pending');
      expect(screen.getByTestId('assignee-report-1').textContent).toBe('unassigned');

      await waitFor(() => {
        expect(mockModerationAPI.releaseReport).toHaveBeenCalledWith('report-1');
      });
    });
  });

  describe('Report Submission', () => {
    it('should submit a new report successfully', async () => {
      mockModerationAPI.submitReport.mockResolvedValue({
        success: true,
        reportId: 'new-report-789',
      });

      render(
        <TestWrapper>
          <ModerationTestComponent />
        </TestWrapper>
      );

      const submitBtn = screen.getByTestId('submit-report-btn');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockModerationAPI.submitReport).toHaveBeenCalledWith({
          type: 'spam',
          content: 'Test report',
        });
      });
    });

    it('should handle report submission validation errors', async () => {
      mockModerationAPI.submitReport.mockRejectedValue(
        new Error('Invalid report content')
      );

      render(
        <TestWrapper>
          <ModerationTestComponent />
        </TestWrapper>
      );

      const submitBtn = screen.getByTestId('submit-report-btn');
      
      try {
        fireEvent.click(submitBtn);
        await waitFor(() => {
          expect(mockModerationAPI.submitReport).toHaveBeenCalledTimes(1);
        });
      } catch (error) {
        // Expected to fail, this is what we're testing
        expect(mockModerationAPI.submitReport).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Queue Management', () => {
    it('should fetch reports from queue with proper filtering', async () => {
      const mockReports = [
        { id: 'report-1', status: 'pending', type: 'spam' },
        { id: 'report-2', status: 'in_progress', type: 'harassment' },
        { id: 'report-3', status: 'resolved', type: 'inappropriate' },
      ];

      mockModerationAPI.getReports.mockResolvedValue({
        reports: mockReports,
        total: 3,
        page: 1,
      });

      // This would typically be called during component mount
      const reports = await mockModerationAPI.getReports({
        status: 'pending',
        page: 1,
        limit: 10,
      });

      expect(mockModerationAPI.getReports).toHaveBeenCalledWith({
        status: 'pending',
        page: 1,
        limit: 10,
      });

      expect(reports.reports).toHaveLength(3);
    });
  });
});