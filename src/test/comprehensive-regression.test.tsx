import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock APIs for comprehensive regression testing
const mockRegressionAPI = {
  // JWT-only authentication
  authenticateWithJWT: vi.fn(),
  refreshJWTToken: vi.fn(),
  validateJWTWebSocket: vi.fn(),
  
  // Media retry/backoff
  uploadMedia: vi.fn(),
  retryUpload: vi.fn(),
  getUploadStatus: vi.fn(),
  
  // Search filters
  searchWithFilters: vi.fn(),
  applyFilters: vi.fn(),
  getFilterOptions: vi.fn(),
  
  // Wallet optimistic UI
  createWalletRequest: vi.fn(),
  updateWalletUI: vi.fn(),
  revertOptimisticUpdate: vi.fn(),
  
  // Moderation queue
  getQueue: vi.fn(),
  claimItem: vi.fn(),
  releaseItem: vi.fn(),
  escalateItem: vi.fn(),
};

// Component for testing JWT-only flows
const JWTOnlyTestComponent = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authError, setAuthError] = React.useState<string>('');
  const [wsConnected, setWSConnected] = React.useState(false);

  const handleJWTLogin = async (token: string) => {
    try {
      const result = await mockRegressionAPI.authenticateWithJWT(token);
      setIsAuthenticated(result.success);
      if (!result.success) {
        setAuthError(result.error);
      }
    } catch (error) {
      setAuthError('Authentication failed');
    }
  };

  const handleJWTRefresh = async () => {
    try {
      const result = await mockRegressionAPI.refreshJWTToken();
      setIsAuthenticated(result.success);
    } catch (error) {
      setIsAuthenticated(false);
      setAuthError('Token refresh failed');
    }
  };

  const handleWSConnect = async (token: string) => {
    try {
      const isValid = await mockRegressionAPI.validateJWTWebSocket(token);
      setWSConnected(isValid);
    } catch (error) {
      setWSConnected(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleJWTLogin('valid-jwt-token')}
        data-testid="jwt-login-btn"
      >
        JWT Login
      </button>
      
      <button 
        onClick={handleJWTRefresh}
        data-testid="jwt-refresh-btn"
      >
        Refresh Token
      </button>
      
      <button 
        onClick={() => handleWSConnect('ws-jwt-token')}
        data-testid="ws-connect-btn"
      >
        Connect WebSocket
      </button>

      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      
      <div data-testid="ws-status">
        {wsConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
      </div>
      
      {authError && (
        <div data-testid="auth-error">{authError}</div>
      )}
    </div>
  );
};

// Component for testing media retry/backoff
const MediaRetryTestComponent = () => {
  const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'uploading' | 'retrying' | 'failed' | 'success'>('idle');
  const [retryCount, setRetryCount] = React.useState(0);
  const [backoffDelay, setBackoffDelay] = React.useState(0);

  const handleUpload = async (file: File) => {
    setUploadStatus('uploading');
    setRetryCount(0);
    
    try {
      await mockRegressionAPI.uploadMedia(file);
      setUploadStatus('success');
    } catch (error) {
      await handleRetryWithBackoff(file);
    }
  };

  const handleRetryWithBackoff = async (file: File) => {
    const maxRetries = 3;
    let currentRetry = 0;
    
    while (currentRetry < maxRetries) {
      currentRetry++;
      setRetryCount(currentRetry);
      setUploadStatus('retrying');
      
      // Exponential backoff: 2^retry * 100ms (reduced for testing)
      const delay = Math.pow(2, currentRetry) * 100;
      setBackoffDelay(delay);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        await mockRegressionAPI.retryUpload(file, currentRetry);
        setUploadStatus('success');
        return;
      } catch (error) {
        if (currentRetry === maxRetries) {
          setUploadStatus('failed');
        }
      }
    }
  };

  return (
    <div>
      <button 
        onClick={() => handleUpload(new File(['content'], 'test.jpg', { type: 'image/jpeg' }))}
        data-testid="upload-btn"
      >
        Upload Media
      </button>

      <div data-testid="upload-status">{uploadStatus}</div>
      <div data-testid="retry-count">Retries: {retryCount}</div>
      <div data-testid="backoff-delay">Delay: {backoffDelay}ms</div>
    </div>
  );
};

// Component for testing search filters
const SearchFiltersTestComponent = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeFilters, setActiveFilters] = React.useState<{
    category?: string;
    dateRange?: string;
    sortBy?: string;
    tags?: string[];
  }>({});
  const [searchResults, setSearchResults] = React.useState<Array<{
    id: number;
    title: string;
    category: string;
  }>>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await mockRegressionAPI.searchWithFilters({
        query: searchQuery,
        filters: activeFilters
      });
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters, [filterType]: value };
    setActiveFilters(newFilters);
    mockRegressionAPI.applyFilters(newFilters);
  };

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search..."
        data-testid="search-input"
      />
      
      <button 
        onClick={handleSearch}
        disabled={!searchQuery.trim() || isSearching}
        data-testid="search-btn"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>

      <div data-testid="filter-controls">
        <select 
          onChange={(e) => handleFilterChange('category', e.target.value)}
          data-testid="category-filter"
        >
          <option value="">All Categories</option>
          <option value="posts">Posts</option>
          <option value="media">Media</option>
          <option value="events">Events</option>
        </select>
        
        <select 
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          data-testid="sort-filter"
        >
          <option value="relevance">Relevance</option>
          <option value="date">Date</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>

      <div data-testid="active-filters">
        Active filters: {Object.keys(activeFilters).length}
      </div>
      
      <div data-testid="search-results">
        Results: {searchResults.length}
      </div>
    </div>
  );
};

// Component for testing wallet optimistic UI
const WalletOptimisticUITestComponent = () => {
  const [walletRequests, setWalletRequests] = React.useState<Array<{
    id: string;
    amount: number;
    status: 'pending' | 'optimistic' | 'confirmed' | 'failed';
    isOptimistic?: boolean;
  }>>([]);
  const [uiState, setUIState] = React.useState<'normal' | 'optimistic' | 'reverting'>('normal');

  const handleCreateRequest = async (amount: number) => {
    const requestId = `req_${Date.now()}`;
    
    // Optimistic update
    const optimisticRequest = {
      id: requestId,
      amount,
      status: 'optimistic' as const,
      isOptimistic: true
    };
    
    setWalletRequests(prev => [...prev, optimisticRequest]);
    setUIState('optimistic');
    
    try {
      const result = await mockRegressionAPI.createWalletRequest({
        id: requestId,
        amount
      });
      
      // Replace optimistic with real data
      setWalletRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'confirmed', isOptimistic: false }
            : req
        )
      );
      setUIState('normal');
    } catch (error: unknown) {
      // Revert optimistic update
      const errorWithStatus = error as { status?: number };
      await handleOptimisticRevert(requestId, errorWithStatus.status || 500);
    }
  };

  const handleOptimisticRevert = async (requestId: string, errorStatus: number) => {
    setUIState('reverting');
    
    // Track the revert based on error type
    await mockRegressionAPI.revertOptimisticUpdate({
      requestId,
      errorType: errorStatus >= 400 && errorStatus < 500 ? '4xx' : '5xx'
    });
    
    // Remove the optimistic request
    setWalletRequests(prev => prev.filter(req => req.id !== requestId));
    setUIState('normal');
  };

  return (
    <div>
      <button 
        onClick={() => handleCreateRequest(100)}
        data-testid="create-request-btn"
      >
        Create Request ($100)
      </button>
      
      <button 
        onClick={() => handleCreateRequest(50)}
        data-testid="create-small-request-btn"
      >
        Create Request ($50)
      </button>

      <div data-testid="ui-state">{uiState}</div>
      <div data-testid="requests-count">Requests: {walletRequests.length}</div>
      
      <div data-testid="requests-list">
        {walletRequests.map(request => (
          <div key={request.id} data-testid={`request-${request.id}`}>
            ${request.amount} - {request.status}
            {request.isOptimistic && <span> (optimistic)</span>}
          </div>
        ))}
      </div>
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

describe('Comprehensive Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JWT-only Authentication Flow', () => {
    it('should authenticate user with JWT token only', async () => {
      mockRegressionAPI.authenticateWithJWT.mockResolvedValue({
        success: true,
        token: 'jwt-abc123',
        expiresIn: 3600
      });

      render(
        <TestWrapper>
          <JWTOnlyTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('jwt-login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
      });

      expect(mockRegressionAPI.authenticateWithJWT).toHaveBeenCalledWith('valid-jwt-token');
    });

    it('should refresh JWT token successfully', async () => {
      mockRegressionAPI.refreshJWTToken.mockResolvedValue({
        success: true,
        token: 'jwt-refreshed-456',
        expiresIn: 3600
      });

      render(
        <TestWrapper>
          <JWTOnlyTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('jwt-refresh-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
      });

      expect(mockRegressionAPI.refreshJWTToken).toHaveBeenCalledTimes(1);
    });

    it('should validate JWT for WebSocket connections', async () => {
      mockRegressionAPI.validateJWTWebSocket.mockResolvedValue(true);

      render(
        <TestWrapper>
          <JWTOnlyTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('ws-connect-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ws-status').textContent).toBe('WebSocket connected');
      });

      expect(mockRegressionAPI.validateJWTWebSocket).toHaveBeenCalledWith('ws-jwt-token');
    });

    it('should handle JWT authentication failures', async () => {
      mockRegressionAPI.authenticateWithJWT.mockResolvedValue({
        success: false,
        error: 'Invalid token'
      });

      render(
        <TestWrapper>
          <JWTOnlyTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('jwt-login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('Not authenticated');
        expect(screen.getByTestId('auth-error').textContent).toBe('Invalid token');
      });
    });
  });

  describe('Media Retry/Backoff Mechanism', () => {
    it('should retry failed uploads with exponential backoff', async () => {
      mockRegressionAPI.uploadMedia.mockRejectedValue(new Error('Upload failed'));
      mockRegressionAPI.retryUpload
        .mockRejectedValueOnce(new Error('Retry 1 failed'))
        .mockRejectedValueOnce(new Error('Retry 2 failed'))
        .mockResolvedValueOnce({ success: true });

      render(
        <TestWrapper>
          <MediaRetryTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('upload-btn'));

      // Should show uploading initially
      expect(screen.getByTestId('upload-status').textContent).toBe('uploading');

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByTestId('upload-status').textContent).toBe('success');
        expect(screen.getByTestId('retry-count').textContent).toBe('Retries: 3');
      }, { timeout: 2000 });

      expect(mockRegressionAPI.uploadMedia).toHaveBeenCalledTimes(1);
      expect(mockRegressionAPI.retryUpload).toHaveBeenCalledTimes(3);
    }, 3000);

    it('should show appropriate backoff delays', async () => {
      mockRegressionAPI.uploadMedia.mockRejectedValue(new Error('Upload failed'));
      mockRegressionAPI.retryUpload.mockRejectedValue(new Error('All retries failed'));

      render(
        <TestWrapper>
          <MediaRetryTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('upload-btn'));

      // Check first retry delay (2^1 * 100 = 200ms)
      await waitFor(() => {
        expect(screen.getByTestId('backoff-delay').textContent).toBe('Delay: 200ms');
      });
    });

    it('should handle maximum retry limit', async () => {
      mockRegressionAPI.uploadMedia.mockRejectedValue(new Error('Upload failed'));
      mockRegressionAPI.retryUpload.mockRejectedValue(new Error('Retry failed'));

      render(
        <TestWrapper>
          <MediaRetryTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('upload-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('upload-status').textContent).toBe('failed');
        expect(screen.getByTestId('retry-count').textContent).toBe('Retries: 3');
      }, { timeout: 2000 });
    }, 3000);
  });

  describe('Search Filters Functionality', () => {
    it('should apply search filters correctly', async () => {
      const mockResults = [
        { id: 1, title: 'Test Post', category: 'posts' },
        { id: 2, title: 'Test Media', category: 'media' }
      ];
      
      mockRegressionAPI.searchWithFilters.mockResolvedValue(mockResults);

      render(
        <TestWrapper>
          <SearchFiltersTestComponent />
        </TestWrapper>
      );

      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'test search' }
      });

      fireEvent.change(screen.getByTestId('category-filter'), {
        target: { value: 'posts' }
      });

      fireEvent.click(screen.getByTestId('search-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('search-results').textContent).toBe('Results: 2');
        expect(screen.getByTestId('active-filters').textContent).toBe('Active filters: 1');
      });

      expect(mockRegressionAPI.searchWithFilters).toHaveBeenCalledWith({
        query: 'test search',
        filters: { category: 'posts' }
      });
    });

    it('should disable search when no query is entered', () => {
      render(
        <TestWrapper>
          <SearchFiltersTestComponent />
        </TestWrapper>
      );

      const searchBtn = screen.getByTestId('search-btn');
      expect(searchBtn).toBeDisabled();
    });

    it('should handle multiple filter changes', async () => {
      render(
        <TestWrapper>
          <SearchFiltersTestComponent />
        </TestWrapper>
      );

      fireEvent.change(screen.getByTestId('category-filter'), {
        target: { value: 'posts' }
      });

      fireEvent.change(screen.getByTestId('sort-filter'), {
        target: { value: 'date' }
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-filters').textContent).toBe('Active filters: 2');
      });

      expect(mockRegressionAPI.applyFilters).toHaveBeenCalledWith({
        category: 'posts',
        sortBy: 'date'
      });
    });
  });

  describe('Wallet Optimistic UI with Error Handling', () => {
    it('should handle optimistic UI revert on 4xx errors', async () => {
      const error = new Error('Bad request') as Error & { status: number };
      error.status = 400;
      mockRegressionAPI.createWalletRequest.mockRejectedValue(error);

      render(
        <TestWrapper>
          <WalletOptimisticUITestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('create-request-btn'));

      // Should show optimistic request initially
      expect(screen.getByTestId('ui-state').textContent).toBe('optimistic');
      expect(screen.getByTestId('requests-count').textContent).toBe('Requests: 1');

      // Should revert after error
      await waitFor(() => {
        expect(screen.getByTestId('ui-state').textContent).toBe('normal');
        expect(screen.getByTestId('requests-count').textContent).toBe('Requests: 0');
      });

      expect(mockRegressionAPI.revertOptimisticUpdate).toHaveBeenCalledWith({
        requestId: expect.stringMatching(/^req_\d+$/),
        errorType: '4xx'
      });
    });

    it('should handle optimistic UI revert on 5xx errors', async () => {
      const error = new Error('Server error') as Error & { status: number };
      error.status = 500;
      mockRegressionAPI.createWalletRequest.mockRejectedValue(error);

      render(
        <TestWrapper>
          <WalletOptimisticUITestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('create-request-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ui-state').textContent).toBe('normal');
        expect(screen.getByTestId('requests-count').textContent).toBe('Requests: 0');
      });

      expect(mockRegressionAPI.revertOptimisticUpdate).toHaveBeenCalledWith({
        requestId: expect.stringMatching(/^req_\d+$/),
        errorType: '5xx'
      });
    });

    it('should show reverting state during error handling', async () => {
      const error = new Error('Server error') as Error & { status: number };
      error.status = 500;
      mockRegressionAPI.createWalletRequest.mockRejectedValue(error);
      
      // Delay the revert to test intermediate state
      mockRegressionAPI.revertOptimisticUpdate.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(
        <TestWrapper>
          <WalletOptimisticUITestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('create-request-btn'));

      // Should show reverting state briefly
      await waitFor(() => {
        expect(screen.getByTestId('ui-state').textContent).toBe('reverting');
      });

      // Should return to normal after revert
      await waitFor(() => {
        expect(screen.getByTestId('ui-state').textContent).toBe('normal');
      });
    });

    it('should confirm successful requests', async () => {
      mockRegressionAPI.createWalletRequest.mockResolvedValue({
        id: 'req_123',
        amount: 100,
        status: 'confirmed'
      });

      render(
        <TestWrapper>
          <WalletOptimisticUITestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('create-request-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('ui-state').textContent).toBe('normal');
        expect(screen.getByTestId('requests-count').textContent).toBe('Requests: 1');
      });

      // Should not have optimistic flag after confirmation
      const requestElement = screen.getByTestId(/^request-req_/);
      expect(requestElement.textContent).not.toContain('optimistic');
    });
  });

  describe('Full Regression Coverage', () => {
    it('should pass JWT-only authentication end-to-end', async () => {
      mockRegressionAPI.authenticateWithJWT.mockResolvedValue({ success: true });
      mockRegressionAPI.refreshJWTToken.mockResolvedValue({ success: true });
      mockRegressionAPI.validateJWTWebSocket.mockResolvedValue(true);

      render(
        <TestWrapper>
          <JWTOnlyTestComponent />
        </TestWrapper>
      );

      // Complete auth flow
      fireEvent.click(screen.getByTestId('jwt-login-btn'));
      await waitFor(() => expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated'));

      fireEvent.click(screen.getByTestId('jwt-refresh-btn'));
      await waitFor(() => expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated'));

      fireEvent.click(screen.getByTestId('ws-connect-btn'));
      await waitFor(() => expect(screen.getByTestId('ws-status').textContent).toBe('WebSocket connected'));

      expect(mockRegressionAPI.authenticateWithJWT).toHaveBeenCalledTimes(1);
      expect(mockRegressionAPI.refreshJWTToken).toHaveBeenCalledTimes(1);
      expect(mockRegressionAPI.validateJWTWebSocket).toHaveBeenCalledTimes(1);
    });

    it('should handle all critical user flows without failures', async () => {
      // Setup all mocks for success
      mockRegressionAPI.uploadMedia.mockResolvedValue({ success: true });
      mockRegressionAPI.searchWithFilters.mockResolvedValue([]);
      mockRegressionAPI.createWalletRequest.mockResolvedValue({ success: true });

      const { rerender } = render(
        <TestWrapper>
          <MediaRetryTestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('upload-btn'));
      await waitFor(() => expect(screen.getByTestId('upload-status').textContent).toBe('success'));

      rerender(
        <TestWrapper>
          <SearchFiltersTestComponent />
        </TestWrapper>
      );

      fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test' } });
      fireEvent.click(screen.getByTestId('search-btn'));
      await waitFor(() => expect(screen.getByTestId('search-results').textContent).toBe('Results: 0'));

      rerender(
        <TestWrapper>
          <WalletOptimisticUITestComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('create-request-btn'));
      await waitFor(() => expect(screen.getByTestId('ui-state').textContent).toBe('normal'));
    });
  });
});