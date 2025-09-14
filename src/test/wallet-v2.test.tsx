import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock Wallet V2 API calls
const mockWalletV2API = {
  createRequest: vi.fn(),
  updateRequestStatus: vi.fn(),
  getRequestById: vi.fn(),
  exportRequestsCSV: vi.fn(),
  getStatusTransitions: vi.fn(),
};

// Component for testing Wallet V2 status transitions
const WalletV2StatusComponent = () => {
  const [request, setRequest] = React.useState<{
    id: string;
    status: string;
    amount: number;
    transitions: Array<{ from: string; to: string; timestamp: string; reason?: string }>;
  } | null>(null);

  const handleStatusUpdate = async (requestId: string, newStatus: string, reason?: string) => {
    try {
      await mockWalletV2API.updateRequestStatus(requestId, newStatus, reason);
      // Fetch updated request
      const updatedRequest = await mockWalletV2API.getRequestById(requestId);
      setRequest(updatedRequest);
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const handleLoadRequest = async (requestId: string) => {
    try {
      const requestData = await mockWalletV2API.getRequestById(requestId);
      setRequest(requestData);
    } catch (error) {
      console.error('Failed to load request:', error);
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleLoadRequest('req-123')} 
        data-testid="load-request-btn"
      >
        Load Request
      </button>
      
      {request && (
        <div data-testid="request-details">
          <div data-testid="request-id">{request.id}</div>
          <div data-testid="request-status">{request.status}</div>
          <div data-testid="request-amount">{request.amount}</div>
          
          <div data-testid="status-buttons">
            <button 
              onClick={() => handleStatusUpdate(request.id, 'approved')}
              data-testid="approve-btn"
            >
              Approve
            </button>
            <button 
              onClick={() => handleStatusUpdate(request.id, 'rejected', 'Insufficient funds')}
              data-testid="reject-btn"
            >
              Reject
            </button>
            <button 
              onClick={() => handleStatusUpdate(request.id, 'processing')}
              data-testid="process-btn"
            >
              Process
            </button>
            <button 
              onClick={() => handleStatusUpdate(request.id, 'completed')}
              data-testid="complete-btn"
            >
              Complete
            </button>
          </div>

          <div data-testid="transitions-list">
            {request.transitions.map((transition, index) => (
              <div key={index} data-testid={`transition-${index}`}>
                {transition.from} → {transition.to} ({transition.timestamp})
                {transition.reason && <span> - {transition.reason}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Component for testing CSV export functionality
const CSVExportComponent = () => {
  const [exportStatus, setExportStatus] = React.useState<string>('');
  const [downloadUrl, setDownloadUrl] = React.useState<string>('');

  const handleExportCSV = async (filters: { 
    status?: string; 
    dateFrom?: string; 
    dateTo?: string; 
  }) => {
    try {
      setExportStatus('exporting');
      const result = await mockWalletV2API.exportRequestsCSV(filters);
      setDownloadUrl(result.downloadUrl);
      setExportStatus('completed');
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus('failed');
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleExportCSV({})}
        data-testid="export-all-btn"
      >
        Export All
      </button>
      
      <button 
        onClick={() => handleExportCSV({ status: 'completed' })}
        data-testid="export-completed-btn"
      >
        Export Completed
      </button>
      
      <button 
        onClick={() => handleExportCSV({ 
          dateFrom: '2024-01-01', 
          dateTo: '2024-01-31' 
        })}
        data-testid="export-filtered-btn"
      >
        Export Filtered
      </button>

      <div data-testid="export-status">{exportStatus}</div>
      {downloadUrl && (
        <a href={downloadUrl} data-testid="download-link">
          Download CSV
        </a>
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

describe('Wallet V2 Status Transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Transition Flow', () => {
    it('should load request with status transitions', async () => {
      const mockRequest = {
        id: 'req-123',
        status: 'pending',
        amount: 500,
        transitions: [
          { from: 'draft', to: 'pending', timestamp: '2024-01-01T10:00:00Z' }
        ]
      };

      mockWalletV2API.getRequestById.mockResolvedValue(mockRequest);

      render(
        <TestWrapper>
          <WalletV2StatusComponent />
        </TestWrapper>
      );

      const loadBtn = screen.getByTestId('load-request-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(screen.getByTestId('request-id').textContent).toBe('req-123');
        expect(screen.getByTestId('request-status').textContent).toBe('pending');
        expect(screen.getByTestId('request-amount').textContent).toBe('500');
      });

      expect(mockWalletV2API.getRequestById).toHaveBeenCalledWith('req-123');
    });

    it('should update status from pending to approved', async () => {
      const initialRequest = {
        id: 'req-123',
        status: 'pending',
        amount: 500,
        transitions: [
          { from: 'draft', to: 'pending', timestamp: '2024-01-01T10:00:00Z' }
        ]
      };

      const updatedRequest = {
        ...initialRequest,
        status: 'approved',
        transitions: [
          ...initialRequest.transitions,
          { from: 'pending', to: 'approved', timestamp: '2024-01-01T11:00:00Z' }
        ]
      };

      mockWalletV2API.getRequestById
        .mockResolvedValueOnce(initialRequest)
        .mockResolvedValueOnce(updatedRequest);
      mockWalletV2API.updateRequestStatus.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <WalletV2StatusComponent />
        </TestWrapper>
      );

      // Load initial request
      const loadBtn = screen.getByTestId('load-request-btn');
      fireEvent.click(loadBtn);

      await waitFor(() => {
        expect(screen.getByTestId('request-status').textContent).toBe('pending');
      });

      // Approve request
      const approveBtn = screen.getByTestId('approve-btn');
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByTestId('request-status').textContent).toBe('approved');
      });

      expect(mockWalletV2API.updateRequestStatus).toHaveBeenCalledWith('req-123', 'approved', undefined);
    });

    it('should update status from pending to rejected with reason', async () => {
      const initialRequest = {
        id: 'req-123',
        status: 'pending',
        amount: 500,
        transitions: [
          { from: 'draft', to: 'pending', timestamp: '2024-01-01T10:00:00Z' }
        ]
      };

      const rejectedRequest = {
        ...initialRequest,
        status: 'rejected',
        transitions: [
          ...initialRequest.transitions,
          { 
            from: 'pending', 
            to: 'rejected', 
            timestamp: '2024-01-01T11:00:00Z',
            reason: 'Insufficient funds'
          }
        ]
      };

      mockWalletV2API.getRequestById
        .mockResolvedValueOnce(initialRequest)
        .mockResolvedValueOnce(rejectedRequest);
      mockWalletV2API.updateRequestStatus.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <WalletV2StatusComponent />
        </TestWrapper>
      );

      // Load and reject
      fireEvent.click(screen.getByTestId('load-request-btn'));
      await waitFor(() => expect(screen.getByTestId('request-status').textContent).toBe('pending'));

      fireEvent.click(screen.getByTestId('reject-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('request-status').textContent).toBe('rejected');
      });

      expect(mockWalletV2API.updateRequestStatus).toHaveBeenCalledWith('req-123', 'rejected', 'Insufficient funds');
    });

    it('should complete full status transition flow', async () => {
      const stages = [
        { status: 'pending', transitions: [{ from: 'draft', to: 'pending', timestamp: '2024-01-01T10:00:00Z' }] },
        { 
          status: 'approved', 
          transitions: [
            { from: 'draft', to: 'pending', timestamp: '2024-01-01T10:00:00Z' },
            { from: 'pending', to: 'approved', timestamp: '2024-01-01T11:00:00Z' }
          ] 
        },
        { 
          status: 'processing', 
          transitions: [
            { from: 'draft', to: 'pending', timestamp: '2024-01-01T10:00:00Z' },
            { from: 'pending', to: 'approved', timestamp: '2024-01-01T11:00:00Z' },
            { from: 'approved', to: 'processing', timestamp: '2024-01-01T12:00:00Z' }
          ] 
        },
        { 
          status: 'completed', 
          transitions: [
            { from: 'draft', to: 'pending', timestamp: '2024-01-01T10:00:00Z' },
            { from: 'pending', to: 'approved', timestamp: '2024-01-01T11:00:00Z' },
            { from: 'approved', to: 'processing', timestamp: '2024-01-01T12:00:00Z' },
            { from: 'processing', to: 'completed', timestamp: '2024-01-01T13:00:00Z' }
          ] 
        }
      ];

      stages.forEach(stage => {
        mockWalletV2API.getRequestById.mockResolvedValueOnce({
          id: 'req-123',
          amount: 500,
          ...stage
        });
      });

      mockWalletV2API.updateRequestStatus.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <WalletV2StatusComponent />
        </TestWrapper>
      );

      // Load initial request
      fireEvent.click(screen.getByTestId('load-request-btn'));
      await waitFor(() => expect(screen.getByTestId('request-status').textContent).toBe('pending'));

      // Approve
      fireEvent.click(screen.getByTestId('approve-btn'));
      await waitFor(() => expect(screen.getByTestId('request-status').textContent).toBe('approved'));

      // Process
      fireEvent.click(screen.getByTestId('process-btn'));
      await waitFor(() => expect(screen.getByTestId('request-status').textContent).toBe('processing'));

      // Complete
      fireEvent.click(screen.getByTestId('complete-btn'));
      await waitFor(() => expect(screen.getByTestId('request-status').textContent).toBe('completed'));

      // Verify all transitions are visible
      await waitFor(() => {
        expect(screen.getByTestId('transition-0').textContent).toContain('draft → pending');
        expect(screen.getByTestId('transition-1').textContent).toContain('pending → approved');
        expect(screen.getByTestId('transition-2').textContent).toContain('approved → processing');
        expect(screen.getByTestId('transition-3').textContent).toContain('processing → completed');
      });
    });
  });

  describe('CSV Export Functionality', () => {
    it('should export all requests to CSV', async () => {
      mockWalletV2API.exportRequestsCSV.mockResolvedValue({
        downloadUrl: 'https://example.com/download/requests.csv',
        filename: 'wallet_requests_all.csv'
      });

      render(
        <TestWrapper>
          <CSVExportComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId('export-all-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByTestId('export-status').textContent).toBe('completed');
        expect(screen.getByTestId('download-link')).toBeInTheDocument();
      });

      expect(mockWalletV2API.exportRequestsCSV).toHaveBeenCalledWith({});
    });

    it('should export filtered requests to CSV', async () => {
      mockWalletV2API.exportRequestsCSV.mockResolvedValue({
        downloadUrl: 'https://example.com/download/requests_completed.csv',
        filename: 'wallet_requests_completed.csv'
      });

      render(
        <TestWrapper>
          <CSVExportComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId('export-completed-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByTestId('export-status').textContent).toBe('completed');
      });

      expect(mockWalletV2API.exportRequestsCSV).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('should export date-filtered requests to CSV', async () => {
      mockWalletV2API.exportRequestsCSV.mockResolvedValue({
        downloadUrl: 'https://example.com/download/requests_filtered.csv',
        filename: 'wallet_requests_jan2024.csv'
      });

      render(
        <TestWrapper>
          <CSVExportComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId('export-filtered-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByTestId('export-status').textContent).toBe('completed');
      });

      expect(mockWalletV2API.exportRequestsCSV).toHaveBeenCalledWith({
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      });
    });

    it('should handle CSV export errors gracefully', async () => {
      mockWalletV2API.exportRequestsCSV.mockRejectedValue(new Error('Export service unavailable'));

      render(
        <TestWrapper>
          <CSVExportComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId('export-all-btn');
      fireEvent.click(exportBtn);

      await waitFor(() => {
        expect(screen.getByTestId('export-status').textContent).toBe('failed');
      });

      expect(mockWalletV2API.exportRequestsCSV).toHaveBeenCalledWith({});
    });

    it('should show export progress', async () => {
      // Simulate delayed response
      mockWalletV2API.exportRequestsCSV.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            downloadUrl: 'https://example.com/download/requests.csv',
            filename: 'wallet_requests.csv'
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <CSVExportComponent />
        </TestWrapper>
      );

      const exportBtn = screen.getByTestId('export-all-btn');
      fireEvent.click(exportBtn);

      // Should show exporting status immediately
      expect(screen.getByTestId('export-status').textContent).toBe('exporting');

      // Should complete after delay
      await waitFor(() => {
        expect(screen.getByTestId('export-status').textContent).toBe('completed');
      });
    });
  });
});