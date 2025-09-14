import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Moderation Escalation API calls
const mockModerationEscalationAPI = {
  escalateReport: vi.fn(),
  deEscalateReport: vi.fn(),
  closeReport: vi.fn(),
  getReportWithSLA: vi.fn(),
  updateSLATimer: vi.fn(),
  getEscalationHistory: vi.fn(),
  assignSupervisor: vi.fn(),
  getSLAMetrics: vi.fn(),
};

// Component for testing moderation escalation functionality
const ModerationEscalationComponent = () => {
  const [report, setReport] = React.useState<{
    id: string;
    status: 'pending' | 'escalated' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    slaTimeRemaining: number; // minutes
    escalationLevel: number;
    assignedTo: string | null;
    supervisor: string | null;
    escalationHistory: Array<{
      action: string;
      timestamp: string;
      performedBy: string;
      reason?: string;
    }>;
  } | null>(null);

  const [slaMetrics, setSLAMetrics] = React.useState<{
    totalReports: number;
    withinSLA: number;
    breachedSLA: number;
    averageResolutionTime: number;
  } | null>(null);

  const handleLoadReport = async (reportId: string) => {
    try {
      const result = await mockModerationEscalationAPI.getReportWithSLA(reportId);
      setReport(result);
    } catch (error) {
      console.error('Failed to load report:', error);
    }
  };

  const handleEscalate = async (reportId: string, reason: string, targetLevel?: number) => {
    try {
      const result = await mockModerationEscalationAPI.escalateReport(reportId, {
        reason,
        targetLevel,
        escalatedBy: 'current-user'
      });
      setReport(result);
    } catch (error) {
      console.error('Escalation failed:', error);
    }
  };

  const handleDeEscalate = async (reportId: string, reason: string) => {
    try {
      const result = await mockModerationEscalationAPI.deEscalateReport(reportId, {
        reason,
        deEscalatedBy: 'supervisor'
      });
      setReport(result);
    } catch (error) {
      console.error('De-escalation failed:', error);
    }
  };

  const handleClose = async (reportId: string, resolution: string) => {
    try {
      const result = await mockModerationEscalationAPI.closeReport(reportId, {
        resolution,
        closedBy: 'current-user'
      });
      setReport(result);
    } catch (error) {
      console.error('Close failed:', error);
    }
  };

  const handleAssignSupervisor = async (reportId: string, supervisorId: string) => {
    try {
      const result = await mockModerationEscalationAPI.assignSupervisor(reportId, supervisorId);
      setReport(result);
    } catch (error) {
      console.error('Supervisor assignment failed:', error);
    }
  };

  const handleGetSLAMetrics = async () => {
    try {
      const result = await mockModerationEscalationAPI.getSLAMetrics();
      setSLAMetrics(result);
    } catch (error) {
      console.error('Failed to get SLA metrics:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleLoadReport('report-123')}
        data-testid="load-report-btn"
      >
        Load Report
      </button>

      {report && (
        <div data-testid="report-details">
          <div data-testid="report-id">{report.id}</div>
          <div data-testid="report-status">{report.status}</div>
          <div data-testid="report-priority">{report.priority}</div>
          <div data-testid="sla-time-remaining">{report.slaTimeRemaining} minutes</div>
          <div data-testid="escalation-level">Level {report.escalationLevel}</div>
          <div data-testid="assigned-to">{report.assignedTo || 'Unassigned'}</div>
          <div data-testid="supervisor">{report.supervisor || 'No supervisor'}</div>

          <div data-testid="action-buttons">
            <button 
              onClick={() => handleEscalate(report.id, 'Complex case requiring specialist attention')}
              data-testid="escalate-btn"
            >
              Escalate
            </button>
            
            <button 
              onClick={() => handleEscalate(report.id, 'Critical severity', 3)}
              data-testid="escalate-critical-btn"
            >
              Escalate to Critical
            </button>
            
            <button 
              onClick={() => handleDeEscalate(report.id, 'Issue resolved at lower level')}
              data-testid="deescalate-btn"
            >
              De-escalate
            </button>
            
            <button 
              onClick={() => handleClose(report.id, 'Resolved: Content removed and user warned')}
              data-testid="close-btn"
            >
              Close Report
            </button>
            
            <button 
              onClick={() => handleAssignSupervisor(report.id, 'supervisor-456')}
              data-testid="assign-supervisor-btn"
            >
              Assign Supervisor
            </button>
          </div>

          <div data-testid="escalation-history">
            {report.escalationHistory.map((entry, index) => (
              <div key={index} data-testid={`history-${index}`}>
                {entry.action} by {entry.performedBy} at {entry.timestamp}
                {entry.reason && <span> - {entry.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={handleGetSLAMetrics}
        data-testid="get-sla-metrics-btn"
      >
        Get SLA Metrics
      </button>

      {slaMetrics && (
        <div data-testid="sla-metrics">
          <div data-testid="total-reports">Total: {slaMetrics.totalReports}</div>
          <div data-testid="within-sla">Within SLA: {slaMetrics.withinSLA}</div>
          <div data-testid="breached-sla">Breached SLA: {slaMetrics.breachedSLA}</div>
          <div data-testid="avg-resolution">Avg Resolution: {slaMetrics.averageResolutionTime}h</div>
        </div>
      )}
    </div>
  );
};

// Component for testing SLA timer functionality
const SLATimerComponent = () => {
  const [timer, setTimer] = React.useState<number>(60); // minutes
  const [status, setStatus] = React.useState<'normal' | 'warning' | 'critical' | 'breached'>('normal');

  React.useEffect(() => {
    if (timer <= 0) {
      setStatus('breached');
      return;
    }
    
    if (timer <= 15) {
      setStatus('critical');
    } else if (timer <= 30) {
      setStatus('warning');
    } else {
      setStatus('normal');
    }
  }, [timer]);

  const simulateTimePass = (minutes: number) => {
    setTimer(prev => Math.max(0, prev - minutes));
  };

  return (
    <div>
      <div data-testid="timer-display">{timer} minutes</div>
      <div data-testid="timer-status">{status}</div>
      
      <button 
        onClick={() => simulateTimePass(10)}
        data-testid="pass-10min-btn"
      >
        Pass 10 minutes
      </button>
      
      <button 
        onClick={() => simulateTimePass(25)}
        data-testid="pass-25min-btn"
      >
        Pass 25 minutes
      </button>
      
      <button 
        onClick={() => simulateTimePass(35)}
        data-testid="pass-35min-btn"
      >
        Pass 35 minutes
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
      {children}
    </QueryClientProvider>
  );
};

describe('Moderation Escalation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Escalation Operations', () => {
    it('should load report with SLA information', async () => {
      const mockReport = {
        id: 'report-123',
        status: 'pending' as const,
        priority: 'medium' as const,
        slaTimeRemaining: 45,
        escalationLevel: 1,
        assignedTo: 'moderator-789',
        supervisor: null,
        escalationHistory: [
          {
            action: 'created',
            timestamp: '2024-01-01T10:00:00Z',
            performedBy: 'system'
          }
        ]
      };

      mockModerationEscalationAPI.getReportWithSLA.mockResolvedValue(mockReport);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      const loadBtn = screen.getByTestId('load-report-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(screen.getByTestId('report-id').textContent).toBe('report-123');
        expect(screen.getByTestId('report-status').textContent).toBe('pending');
        expect(screen.getByTestId('report-priority').textContent).toBe('medium');
        expect(screen.getByTestId('sla-time-remaining').textContent).toBe('45 minutes');
        expect(screen.getByTestId('escalation-level').textContent).toBe('Level 1');
        expect(screen.getByTestId('assigned-to').textContent).toBe('moderator-789');
      });

      expect(mockModerationEscalationAPI.getReportWithSLA).toHaveBeenCalledWith('report-123');
    });

    it('should escalate report to next level', async () => {
      const initialReport = {
        id: 'report-123',
        status: 'pending' as const,
        priority: 'medium' as const,
        slaTimeRemaining: 45,
        escalationLevel: 1,
        assignedTo: 'moderator-789',
        supervisor: null,
        escalationHistory: [
          { action: 'created', timestamp: '2024-01-01T10:00:00Z', performedBy: 'system' }
        ]
      };

      const escalatedReport = {
        ...initialReport,
        status: 'escalated' as const,
        priority: 'high' as const,
        escalationLevel: 2,
        supervisor: 'supervisor-456',
        escalationHistory: [
          ...initialReport.escalationHistory,
          {
            action: 'escalated',
            timestamp: '2024-01-01T10:30:00Z',
            performedBy: 'current-user',
            reason: 'Complex case requiring specialist attention'
          }
        ]
      };

      mockModerationEscalationAPI.getReportWithSLA.mockResolvedValue(initialReport);
      mockModerationEscalationAPI.escalateReport.mockResolvedValue(escalatedReport);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      // Load initial report
      fireEvent.click(screen.getByTestId('load-report-btn'));
      await waitFor(() => expect(screen.getByTestId('escalation-level').textContent).toBe('Level 1'));

      // Escalate
      fireEvent.click(screen.getByTestId('escalate-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('report-status').textContent).toBe('escalated');
        expect(screen.getByTestId('report-priority').textContent).toBe('high');
        expect(screen.getByTestId('escalation-level').textContent).toBe('Level 2');
        expect(screen.getByTestId('supervisor').textContent).toBe('supervisor-456');
      });

      expect(mockModerationEscalationAPI.escalateReport).toHaveBeenCalledWith('report-123', {
        reason: 'Complex case requiring specialist attention',
        targetLevel: undefined,
        escalatedBy: 'current-user'
      });
    });

    it('should escalate report to critical level directly', async () => {
      const initialReport = {
        id: 'report-123',
        status: 'pending' as const,
        priority: 'medium' as const,
        slaTimeRemaining: 5, // Very low time remaining
        escalationLevel: 1,
        assignedTo: 'moderator-789',
        supervisor: null,
        escalationHistory: []
      };

      const criticalReport = {
        ...initialReport,
        status: 'escalated' as const,
        priority: 'critical' as const,
        escalationLevel: 3,
        supervisor: 'senior-supervisor-123',
        escalationHistory: [
          {
            action: 'escalated_to_critical',
            timestamp: '2024-01-01T10:30:00Z',
            performedBy: 'current-user',
            reason: 'Critical severity'
          }
        ]
      };

      mockModerationEscalationAPI.getReportWithSLA.mockResolvedValue(initialReport);
      mockModerationEscalationAPI.escalateReport.mockResolvedValue(criticalReport);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('load-report-btn'));
      await waitFor(() => expect(screen.getByTestId('sla-time-remaining').textContent).toBe('5 minutes'));

      fireEvent.click(screen.getByTestId('escalate-critical-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('report-priority').textContent).toBe('critical');
        expect(screen.getByTestId('escalation-level').textContent).toBe('Level 3');
      });

      expect(mockModerationEscalationAPI.escalateReport).toHaveBeenCalledWith('report-123', {
        reason: 'Critical severity',
        targetLevel: 3,
        escalatedBy: 'current-user'
      });
    });

    it('should de-escalate report when issue is resolved', async () => {
      const escalatedReport = {
        id: 'report-123',
        status: 'escalated' as const,
        priority: 'high' as const,
        slaTimeRemaining: 30,
        escalationLevel: 2,
        assignedTo: 'moderator-789',
        supervisor: 'supervisor-456',
        escalationHistory: [
          { action: 'escalated', timestamp: '2024-01-01T10:30:00Z', performedBy: 'current-user' }
        ]
      };

      const deEscalatedReport = {
        ...escalatedReport,
        status: 'pending' as const,
        priority: 'medium' as const,
        escalationLevel: 1,
        supervisor: null,
        escalationHistory: [
          ...escalatedReport.escalationHistory,
          {
            action: 'de_escalated',
            timestamp: '2024-01-01T11:00:00Z',
            performedBy: 'supervisor',
            reason: 'Issue resolved at lower level'
          }
        ]
      };

      mockModerationEscalationAPI.getReportWithSLA.mockResolvedValue(escalatedReport);
      mockModerationEscalationAPI.deEscalateReport.mockResolvedValue(deEscalatedReport);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('load-report-btn'));
      await waitFor(() => expect(screen.getByTestId('escalation-level').textContent).toBe('Level 2'));

      fireEvent.click(screen.getByTestId('deescalate-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('report-status').textContent).toBe('pending');
        expect(screen.getByTestId('escalation-level').textContent).toBe('Level 1');
        expect(screen.getByTestId('supervisor').textContent).toBe('No supervisor');
      });

      expect(mockModerationEscalationAPI.deEscalateReport).toHaveBeenCalledWith('report-123', {
        reason: 'Issue resolved at lower level',
        deEscalatedBy: 'supervisor'
      });
    });

    it('should close report with resolution', async () => {
      const activeReport = {
        id: 'report-123',
        status: 'escalated' as const,
        priority: 'high' as const,
        slaTimeRemaining: 20,
        escalationLevel: 2,
        assignedTo: 'moderator-789',
        supervisor: 'supervisor-456',
        escalationHistory: []
      };

      const closedReport = {
        ...activeReport,
        status: 'closed' as const,
        escalationHistory: [
          {
            action: 'closed',
            timestamp: '2024-01-01T12:00:00Z',
            performedBy: 'current-user',
            reason: 'Resolved: Content removed and user warned'
          }
        ]
      };

      mockModerationEscalationAPI.getReportWithSLA.mockResolvedValue(activeReport);
      mockModerationEscalationAPI.closeReport.mockResolvedValue(closedReport);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('load-report-btn'));
      await waitFor(() => expect(screen.getByTestId('report-status').textContent).toBe('escalated'));

      fireEvent.click(screen.getByTestId('close-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('report-status').textContent).toBe('closed');
      });

      expect(mockModerationEscalationAPI.closeReport).toHaveBeenCalledWith('report-123', {
        resolution: 'Resolved: Content removed and user warned',
        closedBy: 'current-user'
      });
    });

    it('should assign supervisor to escalated report', async () => {
      const reportWithoutSupervisor = {
        id: 'report-123',
        status: 'escalated' as const,
        priority: 'high' as const,
        slaTimeRemaining: 25,
        escalationLevel: 2,
        assignedTo: 'moderator-789',
        supervisor: null,
        escalationHistory: []
      };

      const reportWithSupervisor = {
        ...reportWithoutSupervisor,
        supervisor: 'supervisor-456'
      };

      mockModerationEscalationAPI.getReportWithSLA.mockResolvedValue(reportWithoutSupervisor);
      mockModerationEscalationAPI.assignSupervisor.mockResolvedValue(reportWithSupervisor);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('load-report-btn'));
      await waitFor(() => expect(screen.getByTestId('supervisor').textContent).toBe('No supervisor'));

      fireEvent.click(screen.getByTestId('assign-supervisor-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('supervisor').textContent).toBe('supervisor-456');
      });

      expect(mockModerationEscalationAPI.assignSupervisor).toHaveBeenCalledWith('report-123', 'supervisor-456');
    });
  });

  describe('SLA Timer Management', () => {
    it('should display SLA timer with correct status levels', () => {
      render(
        <TestWrapper>
          <SLATimerComponent />
        </TestWrapper>
      );

      // Initial state - normal
      expect(screen.getByTestId('timer-display').textContent).toBe('60 minutes');
      expect(screen.getByTestId('timer-status').textContent).toBe('normal');
    });

    it('should update status to warning when time is low', () => {
      render(
        <TestWrapper>
          <SLATimerComponent />
        </TestWrapper>
      );

      // Pass 35 minutes (60 - 35 = 25 minutes remaining)
      fireEvent.click(screen.getByTestId('pass-35min-btn'));

      expect(screen.getByTestId('timer-display').textContent).toBe('25 minutes');
      expect(screen.getByTestId('timer-status').textContent).toBe('warning');
    });

    it('should update status to critical when time is very low', () => {
      render(
        <TestWrapper>
          <SLATimerComponent />
        </TestWrapper>
      );

      // Pass 50 minutes (60 - 50 = 10 minutes remaining)
      fireEvent.click(screen.getByTestId('pass-25min-btn'));
      fireEvent.click(screen.getByTestId('pass-25min-btn'));

      expect(screen.getByTestId('timer-display').textContent).toBe('10 minutes');
      expect(screen.getByTestId('timer-status').textContent).toBe('critical');
    });

    it('should update status to breached when time expires', () => {
      render(
        <TestWrapper>
          <SLATimerComponent />
        </TestWrapper>
      );

      // Pass enough time to exceed SLA
      fireEvent.click(screen.getByTestId('pass-35min-btn'));
      fireEvent.click(screen.getByTestId('pass-35min-btn'));

      expect(screen.getByTestId('timer-display').textContent).toBe('0 minutes');
      expect(screen.getByTestId('timer-status').textContent).toBe('breached');
    });

    it('should get SLA metrics for moderation team', async () => {
      const mockMetrics = {
        totalReports: 150,
        withinSLA: 120,
        breachedSLA: 30,
        averageResolutionTime: 2.5
      };

      mockModerationEscalationAPI.getSLAMetrics.mockResolvedValue(mockMetrics);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('get-sla-metrics-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('total-reports').textContent).toBe('Total: 150');
        expect(screen.getByTestId('within-sla').textContent).toBe('Within SLA: 120');
        expect(screen.getByTestId('breached-sla').textContent).toBe('Breached SLA: 30');
        expect(screen.getByTestId('avg-resolution').textContent).toBe('Avg Resolution: 2.5h');
      });

      expect(mockModerationEscalationAPI.getSLAMetrics).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escalation History Tracking', () => {
    it('should track complete escalation history', async () => {
      const reportWithHistory = {
        id: 'report-123',
        status: 'closed' as const,
        priority: 'high' as const,
        slaTimeRemaining: 0,
        escalationLevel: 2,
        assignedTo: 'moderator-789',
        supervisor: 'supervisor-456',
        escalationHistory: [
          {
            action: 'created',
            timestamp: '2024-01-01T10:00:00Z',
            performedBy: 'system'
          },
          {
            action: 'escalated',
            timestamp: '2024-01-01T10:30:00Z',
            performedBy: 'moderator-789',
            reason: 'Complex case'
          },
          {
            action: 'supervisor_assigned',
            timestamp: '2024-01-01T11:00:00Z',
            performedBy: 'system'
          },
          {
            action: 'closed',
            timestamp: '2024-01-01T11:30:00Z',
            performedBy: 'supervisor-456',
            reason: 'Issue resolved'
          }
        ]
      };

      mockModerationEscalationAPI.getReportWithSLA.mockResolvedValue(reportWithHistory);

      render(
        <TestWrapper>
          <ModerationEscalationComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('load-report-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('history-0').textContent).toContain('created by system');
        expect(screen.getByTestId('history-1').textContent).toContain('escalated by moderator-789');
        expect(screen.getByTestId('history-1').textContent).toContain('Complex case');
        expect(screen.getByTestId('history-2').textContent).toContain('supervisor_assigned by system');
        expect(screen.getByTestId('history-3').textContent).toContain('closed by supervisor-456');
        expect(screen.getByTestId('history-3').textContent).toContain('Issue resolved');
      });
    });
  });
});