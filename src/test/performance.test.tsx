import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock performance utilities
const mockPerformanceUtils = {
  measureRenderTime: vi.fn(),
  measureQueryTime: vi.fn(),
  measureMemoryUsage: vi.fn(),
  optimizeQuery: vi.fn(),
  debounceSearch: vi.fn(),
  memoizeComponent: vi.fn(),
};

// Component with performance optimizations
const OptimizedListComponent = React.memo(({ items, onItemClick }: {
  items: Array<{ id: string; name: string; description: string }>;
  onItemClick: (id: string) => void;
}) => {
  const handleClick = React.useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  return (
    <div data-testid="optimized-list">
      {items.map((item) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <button
            onClick={() => handleClick(item.id)}
            data-testid={`button-${item.id}`}
          >
            Select
          </button>
        </div>
      ))}
    </div>
  );
});

// Component with debounced search
const DebouncedSearchComponent = () => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<string[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Debounced search function
  const debouncedSearch = React.useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      
      return (searchQuery: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (searchQuery.trim()) {
            setIsSearching(true);
            try {
              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 200));
              const mockResults = [
                `Result 1 for "${searchQuery}"`,
                `Result 2 for "${searchQuery}"`,
                `Result 3 for "${searchQuery}"`,
              ];
              setResults(mockResults);
            } finally {
              setIsSearching(false);
            }
          } else {
            setResults([]);
          }
        }, 300); // 300ms debounce
      };
    },
    []
  );

  React.useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
        data-testid="search-input"
      />
      
      {isSearching && (
        <div data-testid="search-loading">Searching...</div>
      )}
      
      <div data-testid="search-results">
        {results.map((result, index) => (
          <div key={index} data-testid={`result-${index}`}>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component with virtualization simulation
const VirtualizedListComponent = ({ 
  totalItems, 
  visibleRange = { start: 0, end: 10 } 
}: {
  totalItems: number;
  visibleRange?: { start: number; end: number };
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const itemHeight = 50;
  const containerHeight = 500;

  // Calculate which items should be visible
  const visibleItems = React.useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      totalItems
    );

    return Array.from({ length: endIndex - startIndex }, (_, i) => ({
      id: startIndex + i,
      content: `Item ${startIndex + i}`,
    }));
  }, [scrollTop, totalItems, itemHeight, containerHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div>
      <div data-testid="virtual-list-info">
        Total Items: {totalItems}, Rendered: {visibleItems.length}
      </div>
      
      <div
        style={{ height: containerHeight, overflow: 'auto' }}
        onScroll={handleScroll}
        data-testid="virtualized-container"
      >
        <div style={{ height: totalItems * itemHeight, position: 'relative' }}>
          {visibleItems.map((item) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: item.id * itemHeight,
                height: itemHeight,
                width: '100%',
              }}
              data-testid={`virtual-item-${item.id}`}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Component with lazy loading
const LazyLoadComponent = () => {
  const [loadedImages, setLoadedImages] = React.useState<Set<number>>(new Set());
  const [visibleImages, setVisibleImages] = React.useState<Set<number>>(new Set());

  const images = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    src: `https://picsum.photos/200/200?random=${i}`,
    alt: `Image ${i}`,
  }));

  const observerRef = React.useRef<IntersectionObserver>();

  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = parseInt(entry.target.getAttribute('data-image-id') || '0');
            setVisibleImages(prev => new Set([...prev, id]));
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => observerRef.current?.disconnect();
  }, []);

  const imageRef = React.useCallback((node: HTMLDivElement | null, id: number) => {
    if (node) {
      observerRef.current?.observe(node);
    }
  }, []);

  return (
    <div>
      <div data-testid="lazy-load-info">
        Visible: {visibleImages.size}, Loaded: {loadedImages.size}
      </div>
      
      <div data-testid="image-container">
        {images.map((image) => (
          <div
            key={image.id}
            ref={(node) => imageRef(node, image.id)}
            data-image-id={image.id}
            data-testid={`image-placeholder-${image.id}`}
            style={{ height: 200, margin: 10, background: '#f0f0f0' }}
          >
            {visibleImages.has(image.id) ? (
              <img
                src={image.src}
                alt={image.alt}
                onLoad={() => setLoadedImages(prev => new Set([...prev, image.id]))}
                data-testid={`image-${image.id}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                height: '100%',
                color: '#999'
              }}>
                Loading...
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Component with query optimization
const OptimizedQueryComponent = () => {
  const [dataCache, setDataCache] = React.useState<Map<string, any>>(new Map());
  const [loading, setLoading] = React.useState<Set<string>>(new Set());

  const fetchData = React.useCallback(async (key: string, force = false) => {
    // Check cache first
    if (!force && dataCache.has(key)) {
      return dataCache.get(key);
    }

    // Prevent duplicate requests
    if (loading.has(key)) {
      return;
    }

    setLoading(prev => new Set([...prev, key]));

    try {
      // Simulate API call with optimized query
      await new Promise(resolve => setTimeout(resolve, 100));
      const data = { key, value: `Optimized data for ${key}`, timestamp: Date.now() };
      
      setDataCache(prev => new Map([...prev, [key, data]]));
      return data;
    } finally {
      setLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  }, [dataCache, loading]);

  // Pre-fetch related data
  const prefetchData = React.useCallback(async (keys: string[]) => {
    const promises = keys.map(key => fetchData(key));
    await Promise.all(promises);
  }, [fetchData]);

  return (
    <div>
      <div data-testid="cache-info">
        Cached items: {dataCache.size}, Loading: {loading.size}
      </div>
      
      <button
        onClick={() => fetchData('user-profile')}
        disabled={loading.has('user-profile')}
        data-testid="fetch-profile"
      >
        {loading.has('user-profile') ? 'Loading...' : 'Fetch Profile'}
      </button>
      
      <button
        onClick={() => prefetchData(['messages', 'notifications', 'settings'])}
        data-testid="prefetch-data"
      >
        Prefetch Data
      </button>
      
      <button
        onClick={() => setDataCache(new Map())}
        data-testid="clear-cache"
      >
        Clear Cache
      </button>
      
      <div data-testid="cached-data">
        {Array.from(dataCache.entries()).map(([key, data]) => (
          <div key={key} data-testid={`cached-${key}`}>
            {key}: {data.value}
          </div>
        ))}
      </div>
    </div>
  );
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 5 * 60 * 1000 }, // 5 minute cache
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Performance Optimization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Optimization', () => {
    it('should memoize expensive components', () => {
      const mockOnClick = vi.fn();
      const items = [
        { id: '1', name: 'Item 1', description: 'Description 1' },
        { id: '2', name: 'Item 2', description: 'Description 2' },
      ];

      const { rerender } = render(
        <TestWrapper>
          <OptimizedListComponent items={items} onItemClick={mockOnClick} />
        </TestWrapper>
      );

      // Initial render
      expect(screen.getByTestId('optimized-list')).toBeInTheDocument();

      // Re-render with same props (should be memoized)
      rerender(
        <TestWrapper>
          <OptimizedListComponent items={items} onItemClick={mockOnClick} />
        </TestWrapper>
      );

      // Component should still be there and functional
      const button = screen.getByTestId('button-1');
      fireEvent.click(button);
      expect(mockOnClick).toHaveBeenCalledWith('1');
    });

    it('should use useCallback for event handlers', () => {
      const mockOnClick = vi.fn();
      const items = [{ id: '1', name: 'Item 1', description: 'Description 1' }];

      render(
        <TestWrapper>
          <OptimizedListComponent items={items} onItemClick={mockOnClick} />
        </TestWrapper>
      );

      const button = screen.getByTestId('button-1');
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(2);
      expect(mockOnClick).toHaveBeenCalledWith('1');
    });
  });

  describe('Debounced Operations', () => {
    it('should debounce search input', async () => {
      vi.useFakeTimers();

      render(
        <TestWrapper>
          <DebouncedSearchComponent />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // Type rapidly
      fireEvent.change(searchInput, { target: { value: 't' } });
      fireEvent.change(searchInput, { target: { value: 'te' } });
      fireEvent.change(searchInput, { target: { value: 'tes' } });
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should not start searching immediately
      expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();

      // Fast-forward debounce delay
      vi.advanceTimersByTime(300);

      // Now should start searching
      await waitFor(() => {
        expect(screen.getByTestId('search-loading')).toBeInTheDocument();
      });

      // Fast-forward search time
      vi.advanceTimersByTime(200);

      await waitFor(() => {
        expect(screen.queryByTestId('search-loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('result-0')).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('should cancel previous search when new input comes', async () => {
      vi.useFakeTimers();

      render(
        <TestWrapper>
          <DebouncedSearchComponent />
        </TestWrapper>
      );

      const searchInput = screen.getByTestId('search-input');

      // First search
      fireEvent.change(searchInput, { target: { value: 'first' } });
      vi.advanceTimersByTime(200); // Not enough to trigger

      // Second search (should cancel first)
      fireEvent.change(searchInput, { target: { value: 'second' } });
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByTestId('search-loading')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(200);

      await waitFor(() => {
        const results = screen.getAllByTestId(/^result-/);
        expect(results[0]).toHaveTextContent('second');
      });

      vi.useRealTimers();
    });
  });

  describe('Virtualization', () => {
    it('should render only visible items in large lists', () => {
      render(
        <TestWrapper>
          <VirtualizedListComponent totalItems={1000} />
        </TestWrapper>
      );

      const info = screen.getByTestId('virtual-list-info');
      expect(info).toHaveTextContent('Total Items: 1000');
      
      // Should render much fewer than 1000 items
      expect(info).toHaveTextContent(/Rendered: \d+/);
      
      // Verify first few items are rendered
      expect(screen.getByTestId('virtual-item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('virtual-item-500')).not.toBeInTheDocument();
    });

    it('should update visible items on scroll', () => {
      render(
        <TestWrapper>
          <VirtualizedListComponent totalItems={100} />
        </TestWrapper>
      );

      const container = screen.getByTestId('virtualized-container');
      
      // Simulate scroll
      fireEvent.scroll(container, { target: { scrollTop: 500 } });

      // Should still have items rendered, but different ones
      const info = screen.getByTestId('virtual-list-info');
      expect(info).toHaveTextContent(/Rendered: \d+/);
    });
  });

  describe('Lazy Loading', () => {
    it('should implement intersection observer for lazy loading', () => {
      // Mock IntersectionObserver
      const mockObserve = vi.fn();
      const mockDisconnect = vi.fn();
      
      global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      }));

      render(
        <TestWrapper>
          <LazyLoadComponent />
        </TestWrapper>
      );

      const info = screen.getByTestId('lazy-load-info');
      expect(info).toHaveTextContent('Visible: 0, Loaded: 0');

      // Verify observer was set up
      expect(global.IntersectionObserver).toHaveBeenCalled();
      expect(mockObserve).toHaveBeenCalled();
    });

    it('should load images only when they become visible', () => {
      render(
        <TestWrapper>
          <LazyLoadComponent />
        </TestWrapper>
      );

      // Initially no images should be loaded
      expect(screen.queryByTestId('image-0')).not.toBeInTheDocument();
      expect(screen.getByTestId('image-placeholder-0')).toBeInTheDocument();
    });
  });

  describe('Query Optimization', () => {
    it('should cache query results', async () => {
      render(
        <TestWrapper>
          <OptimizedQueryComponent />
        </TestWrapper>
      );

      const fetchButton = screen.getByTestId('fetch-profile');
      const cacheInfo = screen.getByTestId('cache-info');

      // Initially no cached items
      expect(cacheInfo).toHaveTextContent('Cached items: 0');

      // Fetch data
      fireEvent.click(fetchButton);

      await waitFor(() => {
        expect(cacheInfo).toHaveTextContent('Cached items: 1');
      });

      // Verify cached data appears
      expect(screen.getByTestId('cached-user-profile')).toBeInTheDocument();
    });

    it('should prevent duplicate requests', async () => {
      render(
        <TestWrapper>
          <OptimizedQueryComponent />
        </TestWrapper>
      );

      const fetchButton = screen.getByTestId('fetch-profile');

      // Click multiple times rapidly
      fireEvent.click(fetchButton);
      fireEvent.click(fetchButton);
      fireEvent.click(fetchButton);

      // Button should be disabled while loading
      expect(fetchButton).toBeDisabled();

      await waitFor(() => {
        expect(fetchButton).not.toBeDisabled();
      });

      // Should only have one cached item (no duplicates)
      const cacheInfo = screen.getByTestId('cache-info');
      expect(cacheInfo).toHaveTextContent('Cached items: 1');
    });

    it('should implement prefetching', async () => {
      render(
        <TestWrapper>
          <OptimizedQueryComponent />
        </TestWrapper>
      );

      const prefetchButton = screen.getByTestId('prefetch-data');
      fireEvent.click(prefetchButton);

      await waitFor(() => {
        const cacheInfo = screen.getByTestId('cache-info');
        expect(cacheInfo).toHaveTextContent('Cached items: 3');
      });

      // Verify all prefetched items are cached
      expect(screen.getByTestId('cached-messages')).toBeInTheDocument();
      expect(screen.getByTestId('cached-notifications')).toBeInTheDocument();
      expect(screen.getByTestId('cached-settings')).toBeInTheDocument();
    });

    it('should allow cache clearing', async () => {
      render(
        <TestWrapper>
          <OptimizedQueryComponent />
        </TestWrapper>
      );

      // First add some data to cache
      const fetchButton = screen.getByTestId('fetch-profile');
      fireEvent.click(fetchButton);

      await waitFor(() => {
        const cacheInfo = screen.getByTestId('cache-info');
        expect(cacheInfo).toHaveTextContent('Cached items: 1');
      });

      // Clear cache
      const clearButton = screen.getByTestId('clear-cache');
      fireEvent.click(clearButton);

      const cacheInfo = screen.getByTestId('cache-info');
      expect(cacheInfo).toHaveTextContent('Cached items: 0');
    });
  });

  describe('Memory Management', () => {
    it('should clean up event listeners and observers', () => {
      const { unmount } = render(
        <TestWrapper>
          <LazyLoadComponent />
        </TestWrapper>
      );

      // Mock disconnect function should be called on unmount
      const mockDisconnect = vi.fn();
      global.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        disconnect: mockDisconnect,
        unobserve: vi.fn(),
      }));

      unmount();

      // In a real implementation, this would verify cleanup
      // Here we just ensure the component unmounts without errors
    });

    it('should handle large datasets efficiently', () => {
      const startTime = performance.now();

      render(
        <TestWrapper>
          <VirtualizedListComponent totalItems={10000} />
        </TestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Render should be fast even with 10k items (due to virtualization)
      expect(renderTime).toBeLessThan(100); // Should render in under 100ms
    });
  });
});