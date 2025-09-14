import '@testing-library/jest-dom';

// Global IntersectionObserver mock for performance tests
global.IntersectionObserver = global.IntersectionObserver || 
  class IntersectionObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  };