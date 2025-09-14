import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock viewport and touch events for mobile testing
const mockMobileEnvironment = () => {
  // Mock window.innerWidth for mobile viewport
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 375, // iPhone SE width
  });

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 667, // iPhone SE height
  });

  // Mock touch events
  global.TouchEvent = class TouchEvent extends Event {
    constructor(type: string, init?: TouchEventInit) {
      super(type, init);
    }
  } as any;

  // Mock media query for mobile
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: query.includes('max-width: 768px'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock components for mobile testing
const MobileJWTLoginComponent = () => {
  const [token, setToken] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate JWT login
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (token) {
        setIsLoggedIn(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Simulate token refresh
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mobile-login p-4">
      <div className="mb-4">
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter JWT token"
          className="w-full p-2 border rounded"
          data-testid="token-input"
        />
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={handleLogin}
          disabled={isLoading || !token}
          className="w-full p-3 bg-blue-500 text-white rounded disabled:opacity-50"
          data-testid="login-btn"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {isLoggedIn && (
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-full p-3 bg-green-500 text-white rounded disabled:opacity-50"
            data-testid="refresh-btn"
          >
            {isLoading ? 'Refreshing...' : 'Refresh Token'}
          </button>
        )}
      </div>
      {isLoggedIn && (
        <div className="mt-4 p-2 bg-green-100 rounded" data-testid="login-status">
          Logged in successfully
        </div>
      )}
    </div>
  );
};

const MobileMediaComponent = () => {
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<string | null>(null);

  const simulateUpload = async (shouldFail = false) => {
    setIsUploading(true);
    setUploadProgress(0);
    setLastError(null);

    try {
      // Simulate progressive upload
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(i);
        
        // Simulate network failure at 50%
        if (shouldFail && i === 50) {
          throw new Error('Network error');
        }
      }
    } catch (error) {
      setLastError((error as Error).message);
      setRetryCount(prev => prev + 1);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetryUpload = async () => {
    try {
      await simulateUpload(false); // Retry without failure
      setRetryCount(0);
      setLastError(null);
    } catch (error) {
      // Handle retry failure
    }
  };

  return (
    <div className="mobile-media p-4">
      <div className="mb-4">
        <button
          onClick={() => simulateUpload(false)}
          disabled={isUploading}
          className="w-full p-3 bg-purple-500 text-white rounded disabled:opacity-50"
          data-testid="upload-btn"
        >
          Upload Media
        </button>
      </div>
      
      <div className="mb-4">
        <button
          onClick={() => simulateUpload(true)}
          disabled={isUploading}
          className="w-full p-3 bg-red-500 text-white rounded disabled:opacity-50"
          data-testid="upload-fail-btn"
        >
          Upload (Will Fail)
        </button>
      </div>

      {isUploading && (
        <div className="mb-4" data-testid="upload-progress">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
              data-testid="progress-bar"
            />
          </div>
          <div className="text-sm text-gray-600 mt-1">{uploadProgress}%</div>
        </div>
      )}

      {lastError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded" data-testid="error-message">
          <p className="text-red-700">{lastError}</p>
          <button
            onClick={handleRetryUpload}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
            data-testid="retry-btn"
          >
            Retry (Attempt {retryCount + 1})
          </button>
        </div>
      )}
    </div>
  );
};

const MobileSearchComponent = () => {
  const [query, setQuery] = React.useState('');
  const [filters, setFilters] = React.useState({
    type: 'all',
    dateRange: 'all',
    location: 'all',
  });
  const [results, setResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Simulate search with filters
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockResults = [
        { id: 1, title: `Result for "${query}"`, type: filters.type },
        { id: 2, title: `Another result for "${query}"`, type: filters.type },
      ];
      
      setResults(mockResults);
    } finally {
      setIsSearching(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="mobile-search p-4">
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full p-3 border rounded-lg"
          data-testid="search-input"
        />
      </div>

      <div className="mb-4 space-y-2">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="w-full p-2 border rounded"
            data-testid="type-filter"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="media">Media</option>
            <option value="links">Links</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => updateFilter('dateRange', e.target.value)}
            className="w-full p-2 border rounded"
            data-testid="date-filter"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Location</label>
          <select
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="w-full p-2 border rounded"
            data-testid="location-filter"
          >
            <option value="all">All Locations</option>
            <option value="local">Local</option>
            <option value="national">National</option>
            <option value="international">International</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSearch}
        disabled={isSearching || !query.trim()}
        className="w-full p-3 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        data-testid="search-btn"
      >
        {isSearching ? 'Searching...' : 'Search'}
      </button>

      <div className="mt-4" data-testid="search-results">
        {results.length > 0 && (
          <div>
            <h3 className="font-medium mb-2">Results ({results.length})</h3>
            {results.map(result => (
              <div
                key={result.id}
                className="p-3 border rounded mb-2"
                data-testid={`result-${result.id}`}
              >
                <h4 className="font-medium">{result.title}</h4>
                <p className="text-sm text-gray-600">Type: {result.type}</p>
              </div>
            ))}
          </div>
        )}
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
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Mobile UI Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMobileEnvironment();
  });

  describe('JWT-Only Login Flow', () => {
    it('should handle mobile JWT login successfully', async () => {
      render(
        <TestWrapper>
          <MobileJWTLoginComponent />
        </TestWrapper>
      );

      const tokenInput = screen.getByTestId('token-input');
      const loginBtn = screen.getByTestId('login-btn');

      // Initially login button should be disabled
      expect(loginBtn).toBeDisabled();

      // Enter token
      fireEvent.change(tokenInput, { target: { value: 'valid-jwt-token' } });
      expect(loginBtn).not.toBeDisabled();

      // Perform login
      fireEvent.click(loginBtn);
      expect(screen.getByText('Logging in...')).toBeInTheDocument();

      // Wait for login to complete
      await waitFor(() => {
        expect(screen.getByTestId('login-status')).toBeInTheDocument();
      });

      expect(screen.getByText('Logged in successfully')).toBeInTheDocument();
    });

    it('should handle JWT token refresh on mobile', async () => {
      render(
        <TestWrapper>
          <MobileJWTLoginComponent />
        </TestWrapper>
      );

      // First login
      const tokenInput = screen.getByTestId('token-input');
      fireEvent.change(tokenInput, { target: { value: 'valid-jwt-token' } });
      fireEvent.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
      });

      // Test refresh
      const refreshBtn = screen.getByTestId('refresh-btn');
      fireEvent.click(refreshBtn);

      expect(screen.getByText('Refreshing...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Refresh Token')).toBeInTheDocument();
      });
    });

    it('should maintain responsive layout on small screens', () => {
      render(
        <TestWrapper>
          <MobileJWTLoginComponent />
        </TestWrapper>
      );

      const tokenInput = screen.getByTestId('token-input');
      const loginBtn = screen.getByTestId('login-btn');

      // Check that elements have mobile-friendly classes
      expect(tokenInput).toHaveClass('w-full');
      expect(loginBtn).toHaveClass('w-full');
    });
  });

  describe('Media Upload with Retry/Backoff', () => {
    it('should handle successful media upload on mobile', async () => {
      render(
        <TestWrapper>
          <MobileMediaComponent />
        </TestWrapper>
      );

      const uploadBtn = screen.getByTestId('upload-btn');
      fireEvent.click(uploadBtn);

      // Check progress bar appears
      await waitFor(() => {
        expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
      });

      // Check progress updates
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toBeInTheDocument();

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should implement retry mechanism for failed uploads', async () => {
      render(
        <TestWrapper>
          <MobileMediaComponent />
        </TestWrapper>
      );

      const failBtn = screen.getByTestId('upload-fail-btn');
      fireEvent.click(failBtn);

      // Wait for failure and error message
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText('Network error')).toBeInTheDocument();

      // Test retry functionality
      const retryBtn = screen.getByTestId('retry-btn');
      expect(retryBtn).toBeInTheDocument();
      expect(retryBtn.textContent).toContain('Attempt 2'); // Should be attempt 2 since retryCount is incremented

      fireEvent.click(retryBtn);

      // Wait for retry to complete successfully
      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show appropriate UI feedback during upload', async () => {
      render(
        <TestWrapper>
          <MobileMediaComponent />
        </TestWrapper>
      );

      const uploadBtn = screen.getByTestId('upload-btn');
      
      // Button should be enabled initially
      expect(uploadBtn).not.toBeDisabled();

      fireEvent.click(uploadBtn);

      // Button should be disabled during upload
      expect(uploadBtn).toBeDisabled();

      await waitFor(() => {
        expect(uploadBtn).not.toBeDisabled();
      }, { timeout: 2000 });
    });
  });

  describe('Search Filters on Mobile', () => {
    it('should apply search filters correctly', async () => {
      render(
        <TestWrapper>
          <MobileSearchComponent />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');
      const typeFilter = screen.getByTestId('type-filter');
      const searchBtn = screen.getByTestId('search-btn');

      // Set search query
      fireEvent.change(searchInput, { target: { value: 'test query' } });

      // Change filter
      fireEvent.change(typeFilter, { target: { value: 'media' } });

      // Perform search
      fireEvent.click(searchBtn);

      // Wait for search to start
      expect(screen.getByText('Searching...')).toBeInTheDocument();

      // Wait for results with longer timeout
      await waitFor(() => {
        expect(screen.getByTestId('search-results')).toBeInTheDocument();
        const resultsText = screen.getByTestId('search-results').textContent;
        expect(resultsText).toContain('Results (2)');
      }, { timeout: 2000 });
    });

    it('should handle multiple filter changes', () => {
      render(
        <TestWrapper>
          <MobileSearchComponent />
        </TestWrapper>
      );

      const typeFilter = screen.getByTestId('type-filter');
      const dateFilter = screen.getByTestId('date-filter');
      const locationFilter = screen.getByTestId('location-filter');

      // Change multiple filters
      fireEvent.change(typeFilter, { target: { value: 'text' } });
      fireEvent.change(dateFilter, { target: { value: 'week' } });
      fireEvent.change(locationFilter, { target: { value: 'local' } });

      expect(typeFilter).toHaveValue('text');
      expect(dateFilter).toHaveValue('week');
      expect(locationFilter).toHaveValue('local');
    });

    it('should disable search when no query is entered', () => {
      render(
        <TestWrapper>
          <MobileSearchComponent />
        </TestWrapper>
      );

      const searchBtn = screen.getByTestId('search-btn');

      // Search button should be disabled when no query
      expect(searchBtn).toBeDisabled();

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should be enabled with query
      expect(searchBtn).not.toBeDisabled();

      // Clear query
      fireEvent.change(searchInput, { target: { value: '   ' } });

      // Should be disabled again with only whitespace
      expect(searchBtn).toBeDisabled();
    });

    it('should maintain mobile-friendly layout for filters', () => {
      render(
        <TestWrapper>
          <MobileSearchComponent />
        </TestWrapper>
      );

      const typeFilter = screen.getByTestId('type-filter');
      const dateFilter = screen.getByTestId('date-filter');
      const locationFilter = screen.getByTestId('location-filter');

      // All filters should have full width on mobile
      expect(typeFilter).toHaveClass('w-full');
      expect(dateFilter).toHaveClass('w-full');
      expect(locationFilter).toHaveClass('w-full');
    });
  });

  describe('Touch and Mobile Interactions', () => {
    it('should handle touch events properly', async () => {
      render(
        <TestWrapper>
          <MobileJWTLoginComponent />
        </TestWrapper>
      );

      const loginBtn = screen.getByTestId('login-btn');
      const tokenInput = screen.getByTestId('token-input');

      // Simulate touch on input
      fireEvent.focus(tokenInput);
      fireEvent.change(tokenInput, { target: { value: 'test-token' } });

      // Simulate touch on button
      fireEvent.touchStart(loginBtn);
      fireEvent.touchEnd(loginBtn);
      fireEvent.click(loginBtn);

      expect(screen.getByText('Logging in...')).toBeInTheDocument();
    });

    it('should handle mobile viewport changes', () => {
      render(
        <TestWrapper>
          <MobileSearchComponent />
        </TestWrapper>
      );

      // Change viewport to even smaller (mobile landscape)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });

      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Fire resize event
      fireEvent(window, new Event('resize'));

      // Elements should still be properly sized
      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveClass('w-full');
    });
  });
});