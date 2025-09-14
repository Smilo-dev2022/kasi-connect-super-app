import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock APIs for regression testing
const mockAuthAPI = {
  loginWithJWT: vi.fn(),
  refreshToken: vi.fn(),
  validateJWT: vi.fn(),
  logout: vi.fn(),
};

const mockMediaAPI = {
  uploadMedia: vi.fn(),
  retryUpload: vi.fn(),
  getUploadStatus: vi.fn(),
};

const mockSearchAPI = {
  searchMessages: vi.fn(),
  applyFilters: vi.fn(),
  getSearchSuggestions: vi.fn(),
};

// JWT-only authentication component for regression testing
const JWTOnlyAuthComponent = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string>('');

  const handleJWTLogin = async (jwtToken: string) => {
    try {
      setError('');
      const result = await mockAuthAPI.loginWithJWT(jwtToken);
      setToken(result.token);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
    }
  };

  const handleTokenRefresh = async () => {
    if (!token) return;
    
    try {
      const result = await mockAuthAPI.refreshToken(token);
      setToken(result.token);
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
      setToken(null);
    }
  };

  const handleLogout = () => {
    mockAuthAPI.logout();
    setIsAuthenticated(false);
    setToken(null);
    setError('');
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="token-display">{token || 'No Token'}</div>
      <div data-testid="error-display">{error}</div>
      <button 
        onClick={() => handleJWTLogin('valid-jwt-token')} 
        data-testid="jwt-login-btn"
      >
        JWT Login
      </button>
      <button 
        onClick={handleTokenRefresh} 
        data-testid="refresh-btn"
        disabled={!token}
      >
        Refresh Token
      </button>
      <button 
        onClick={handleLogout} 
        data-testid="logout-btn"
      >
        Logout
      </button>
    </div>
  );
};

// Media retry component with exponential backoff
const MediaRetryComponent = () => {
  const [uploadStatus, setUploadStatus] = React.useState<string>('ready');
  const [retryCount, setRetryCount] = React.useState(0);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  const calculateBackoffDelay = (attempt: number) => {
    return Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
  };

  const uploadWithRetry = async (file: File, maxRetries: number = 3) => {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        setUploadStatus('uploading');
        setRetryCount(attempt);
        setUploadProgress(0);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 100);

        const result = await mockMediaAPI.uploadMedia(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        setUploadStatus('success');
        return result;
        
      } catch (error: any) {
        attempt++;
        setRetryCount(attempt);
        
        if (attempt < maxRetries) {
          setUploadStatus('retrying');
          const delay = calculateBackoffDelay(attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          setUploadStatus('failed');
          throw error;
        }
      }
    }
  };

  const handleFileUpload = () => {
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    uploadWithRetry(mockFile);
  };

  return (
    <div>
      <div data-testid="upload-status">{uploadStatus}</div>
      <div data-testid="retry-count">Retries: {retryCount}</div>
      <div data-testid="upload-progress">Progress: {uploadProgress}%</div>
      <button 
        onClick={handleFileUpload} 
        data-testid="upload-btn"
        disabled={uploadStatus === 'uploading' || uploadStatus === 'retrying'}
      >
        Upload File
      </button>
    </div>
  );
};

// Search filters component
const SearchFiltersComponent = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState({
    dateRange: 'all',
    messageType: 'all',
    sender: 'all',
    hasMedia: false,
  });
  const [results, setResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const applySearchFilters = async () => {
    setIsSearching(true);
    
    try {
      const searchParams = {
        query: searchQuery,
        filters: filters,
      };
      
      const searchResults = await mockSearchAPI.searchMessages(searchParams);
      setResults(searchResults.messages);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'all',
      messageType: 'all',
      sender: 'all',
      hasMedia: false,
    });
    setSearchQuery('');
    setResults([]);
  };

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search messages..."
        data-testid="search-input"
      />
      
      <select
        value={filters.dateRange}
        onChange={(e) => updateFilter('dateRange', e.target.value)}
        data-testid="date-filter"
      >
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>

      <select
        value={filters.messageType}
        onChange={(e) => updateFilter('messageType', e.target.value)}
        data-testid="type-filter"
      >
        <option value="all">All Types</option>
        <option value="text">Text Only</option>
        <option value="media">Media</option>
        <option value="file">Files</option>
      </select>

      <label>
        <input
          type="checkbox"
          checked={filters.hasMedia}
          onChange={(e) => updateFilter('hasMedia', e.target.checked)}
          data-testid="media-filter"
        />
        Has Media
      </label>

      <button 
        onClick={applySearchFilters} 
        data-testid="search-btn"
        disabled={isSearching || !searchQuery}
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>

      <button 
        onClick={clearFilters} 
        data-testid="clear-filters-btn"
      >
        Clear Filters
      </button>

      <div data-testid="results-count">
        Results: {results.length}
      </div>

      <div data-testid="search-status">
        {isSearching ? 'Searching...' : 'Ready'}
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

describe('Regression Tests - Full Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('JWT-Only Authentication Flow', () => {
    it('should complete full JWT-only login flow successfully', async () => {
      mockAuthAPI.loginWithJWT.mockResolvedValue({
        token: 'new-jwt-token-12345',
        user: { id: 'user123', email: 'test@example.com' },
      });

      render(
        <TestWrapper>
          <JWTOnlyAuthComponent />
        </TestWrapper>
      );

      // Initial state
      expect(screen.getByTestId('auth-status').textContent).toBe('Not Authenticated');
      expect(screen.getByTestId('token-display').textContent).toBe('No Token');

      // Perform JWT login
      const loginBtn = screen.getByTestId('jwt-login-btn');
      fireEvent.click(loginBtn);

      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
        expect(screen.getByTestId('token-display').textContent).toBe('new-jwt-token-12345');
        expect(mockAuthAPI.loginWithJWT).toHaveBeenCalledWith('valid-jwt-token');
      }, { timeout: 10000 });
    }, 15000);

    it('should handle JWT token refresh flow', async () => {
      // Setup initial login
      mockAuthAPI.loginWithJWT.mockResolvedValue({
        token: 'initial-token',
        user: { id: 'user123' },
      });

      mockAuthAPI.refreshToken.mockResolvedValue({
        token: 'refreshed-token-67890',
      });

      render(
        <TestWrapper>
          <JWTOnlyAuthComponent />
        </TestWrapper>
      );

      // Login first
      fireEvent.click(screen.getByTestId('jwt-login-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('token-display').textContent).toBe('initial-token');
      }, { timeout: 10000 });

      // Refresh token
      fireEvent.click(screen.getByTestId('refresh-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('token-display').textContent).toBe('refreshed-token-67890');
        expect(mockAuthAPI.refreshToken).toHaveBeenCalledWith('initial-token');
      }, { timeout: 10000 });
    }, 15000);

    it('should handle JWT authentication errors', async () => {
      mockAuthAPI.loginWithJWT.mockRejectedValue(new Error('Invalid JWT token'));

      render(
        <TestWrapper>
          <JWTOnlyAuthComponent />
        </TestWrapper>
      );

      fireEvent.click(screen.getByTestId('jwt-login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('error-display').textContent).toBe('Invalid JWT token');
        expect(screen.getByTestId('auth-status').textContent).toBe('Not Authenticated');
      }, { timeout: 10000 });
    }, 15000);

    it('should handle logout and session cleanup', async () => {
      // Setup authenticated state
      mockAuthAPI.loginWithJWT.mockResolvedValue({
        token: 'test-token',
        user: { id: 'user123' },
      });

      render(
        <TestWrapper>
          <JWTOnlyAuthComponent />
        </TestWrapper>
      );

      // Login
      fireEvent.click(screen.getByTestId('jwt-login-btn'));
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
      }, { timeout: 10000 });

      // Logout
      fireEvent.click(screen.getByTestId('logout-btn'));

      expect(screen.getByTestId('auth-status').textContent).toBe('Not Authenticated');
      expect(screen.getByTestId('token-display').textContent).toBe('No Token');
      expect(screen.getByTestId('error-display').textContent).toBe('');
      expect(mockAuthAPI.logout).toHaveBeenCalledTimes(1);
    }, 15000);
  });

  describe('Media Retry with Exponential Backoff', () => {
    it('should retry failed uploads with exponential backoff', async () => {
      // Use real timers for this test to avoid interference
      vi.useRealTimers();
      
      // Mock to fail first two attempts, succeed on third
      mockMediaAPI.uploadMedia
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Server busy'))
        .mockResolvedValueOnce({ id: 'upload-123', url: 'https://example.com/file.jpg' });

      render(
        <TestWrapper>
          <MediaRetryComponent />
        </TestWrapper>
      );

      const uploadBtn = screen.getByTestId('upload-btn');
      fireEvent.click(uploadBtn);

      // Should be uploading initially
      await waitFor(() => {
        expect(screen.getByTestId('upload-status').textContent).toBe('uploading');
      }, { timeout: 10000 });

      // Wait for final success (allowing time for retries)
      await waitFor(() => {
        expect(screen.getByTestId('upload-status').textContent).toBe('success');
        expect(screen.getByTestId('upload-progress').textContent).toBe('Progress: 100%');
      }, { timeout: 20000 });

      expect(mockMediaAPI.uploadMedia).toHaveBeenCalledTimes(3);
      
      // Reset timers for other tests
      vi.useFakeTimers();
    }, 25000);

    it('should fail after maximum retry attempts', async () => {
      // Use real timers for this test
      vi.useRealTimers();
      
      // Mock to always fail
      mockMediaAPI.uploadMedia.mockRejectedValue(new Error('Persistent failure'));

      render(
        <TestWrapper>
          <MediaRetryComponent />
        </TestWrapper>
      );

      const uploadBtn = screen.getByTestId('upload-btn');
      fireEvent.click(uploadBtn);

      // Wait for final failure after all retries
      await waitFor(() => {
        expect(screen.getByTestId('upload-status').textContent).toBe('failed');
        expect(screen.getByTestId('retry-count').textContent).toBe('Retries: 3');
      }, { timeout: 20000 });

      expect(mockMediaAPI.uploadMedia).toHaveBeenCalledTimes(3);
      
      // Reset timers for other tests  
      vi.useFakeTimers();
    }, 25000);

    it('should calculate correct exponential backoff delays', () => {
      const calculateBackoffDelay = (attempt: number) => {
        return Math.min(1000 * Math.pow(2, attempt), 30000);
      };

      expect(calculateBackoffDelay(0)).toBe(1000);   // 1 second
      expect(calculateBackoffDelay(1)).toBe(2000);   // 2 seconds
      expect(calculateBackoffDelay(2)).toBe(4000);   // 4 seconds
      expect(calculateBackoffDelay(3)).toBe(8000);   // 8 seconds
      expect(calculateBackoffDelay(10)).toBe(30000); // Capped at 30 seconds
    });
  });

  describe('Search Filters Integration', () => {
    it('should apply multiple search filters correctly', async () => {
      const mockSearchResults = {
        messages: [
          { id: 'msg1', content: 'Test message', type: 'text', hasMedia: false },
          { id: 'msg2', content: 'Image message', type: 'media', hasMedia: true },
        ],
        total: 2,
        filters: {
          dateRange: 'week',
          messageType: 'all',
          hasMedia: false,
        },
      };

      mockSearchAPI.searchMessages.mockResolvedValue(mockSearchResults);

      render(
        <TestWrapper>
          <SearchFiltersComponent />
        </TestWrapper>
      );

      // Set search query
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      // Set date filter
      const dateFilter = screen.getByTestId('date-filter');
      fireEvent.change(dateFilter, { target: { value: 'week' } });

      // Set type filter
      const typeFilter = screen.getByTestId('type-filter');
      fireEvent.change(typeFilter, { target: { value: 'text' } });

      // Perform search
      const searchBtn = screen.getByTestId('search-btn');
      fireEvent.click(searchBtn);

      await waitFor(() => {
        expect(screen.getByTestId('results-count').textContent).toBe('Results: 2');
        expect(mockSearchAPI.searchMessages).toHaveBeenCalledWith({
          query: 'test query',
          filters: {
            dateRange: 'week',
            messageType: 'text',
            sender: 'all',
            hasMedia: false,
          },
        });
      }, { timeout: 10000 });
    }, 15000);

    it('should clear all filters when clear button is clicked', async () => {
      render(
        <TestWrapper>
          <SearchFiltersComponent />
        </TestWrapper>
      );

      // Set some filters
      fireEvent.change(screen.getByTestId('search-input'), { 
        target: { value: 'test search' } 
      });
      fireEvent.change(screen.getByTestId('date-filter'), { 
        target: { value: 'today' } 
      });
      fireEvent.click(screen.getByTestId('media-filter'));

      // Clear filters
      fireEvent.click(screen.getByTestId('clear-filters-btn'));

      expect(screen.getByTestId('search-input')).toHaveValue('');
      expect(screen.getByTestId('date-filter')).toHaveValue('all');
      expect(screen.getByTestId('type-filter')).toHaveValue('all');
      expect(screen.getByTestId('media-filter')).not.toBeChecked();
      expect(screen.getByTestId('results-count').textContent).toBe('Results: 0');
    });

    it('should disable search button when query is empty', () => {
      render(
        <TestWrapper>
          <SearchFiltersComponent />
        </TestWrapper>
      );

      const searchBtn = screen.getByTestId('search-btn');
      expect(searchBtn).toBeDisabled();

      // Add search query
      fireEvent.change(screen.getByTestId('search-input'), { 
        target: { value: 'test' } 
      });

      expect(searchBtn).not.toBeDisabled();

      // Clear search query
      fireEvent.change(screen.getByTestId('search-input'), { 
        target: { value: '' } 
      });

      expect(searchBtn).toBeDisabled();
    });

    it('should handle search errors gracefully', async () => {
      mockSearchAPI.searchMessages.mockRejectedValue(new Error('Search service unavailable'));

      render(
        <TestWrapper>
          <SearchFiltersComponent />
        </TestWrapper>
      );

      fireEvent.change(screen.getByTestId('search-input'), { 
        target: { value: 'test query' } 
      });
      fireEvent.click(screen.getByTestId('search-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('results-count').textContent).toBe('Results: 0');
        expect(screen.getByTestId('search-status').textContent).toBe('Ready');
      }, { timeout: 10000 });
    }, 15000);
  });

  describe('End-to-End Regression Flow', () => {
    it('should complete full user journey: login -> upload -> search', async () => {
      // Use real timers for complex E2E flow
      vi.useRealTimers();
      
      // Setup mocks for complete flow
      mockAuthAPI.loginWithJWT.mockResolvedValue({
        token: 'user-token',
        user: { id: 'user123' },
      });

      mockMediaAPI.uploadMedia.mockResolvedValue({
        id: 'upload-456',
        url: 'https://example.com/media.jpg',
      });

      mockSearchAPI.searchMessages.mockResolvedValue({
        messages: [
          { id: 'msg1', content: 'Found message', hasMedia: true },
        ],
        total: 1,
      });

      const FullFlowComponent = () => {
        const [step, setStep] = React.useState(1);

        return (
          <div>
            <div data-testid="current-step">Step: {step}</div>
            
            {step === 1 && (
              <div>
                <JWTOnlyAuthComponent />
                <button 
                  onClick={() => setStep(2)} 
                  data-testid="next-step-btn"
                >
                  Next: Media Upload
                </button>
              </div>
            )}
            
            {step === 2 && (
              <div>
                <MediaRetryComponent />
                <button 
                  onClick={() => setStep(3)} 
                  data-testid="next-step-btn"
                >
                  Next: Search
                </button>
              </div>
            )}
            
            {step === 3 && (
              <div>
                <SearchFiltersComponent />
                <div data-testid="flow-complete">Flow Complete!</div>
              </div>
            )}
          </div>
        );
      };

      render(
        <TestWrapper>
          <FullFlowComponent />
        </TestWrapper>
      );

      // Step 1: JWT Login
      expect(screen.getByTestId('current-step').textContent).toBe('Step: 1');
      fireEvent.click(screen.getByTestId('jwt-login-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
      }, { timeout: 10000 });

      fireEvent.click(screen.getByTestId('next-step-btn'));

      // Step 2: Media Upload
      expect(screen.getByTestId('current-step').textContent).toBe('Step: 2');
      fireEvent.click(screen.getByTestId('upload-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-status').textContent).toBe('success');
      }, { timeout: 15000 });

      fireEvent.click(screen.getByTestId('next-step-btn'));

      // Step 3: Search
      expect(screen.getByTestId('current-step').textContent).toBe('Step: 3');
      fireEvent.change(screen.getByTestId('search-input'), { 
        target: { value: 'test search' } 
      });
      fireEvent.click(screen.getByTestId('search-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('results-count').textContent).toBe('Results: 1');
        expect(screen.getByTestId('flow-complete')).toBeInTheDocument();
      }, { timeout: 10000 });

      // Verify all APIs were called correctly
      expect(mockAuthAPI.loginWithJWT).toHaveBeenCalledTimes(1);
      expect(mockMediaAPI.uploadMedia).toHaveBeenCalledTimes(1);
      expect(mockSearchAPI.searchMessages).toHaveBeenCalledTimes(1);
      
      // Reset timers
      vi.useFakeTimers();
    }, 45000);
  });
});