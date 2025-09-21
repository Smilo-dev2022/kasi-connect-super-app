import { createCircuitBreaker } from './circuit-breaker';

// This file is for testing purposes only.
// It exports the internal state of the circuit breaker so that we can
// manually control it in our tests.

export const testableCircuitBreaker = createCircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000,
});

// We are not exporting the internal state anymore.
// We will test the circuit breaker through its public interface.
export {};
