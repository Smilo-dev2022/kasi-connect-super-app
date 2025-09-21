type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export function createCircuitBreaker(options: CircuitBreakerOptions) {
  let state: CircuitState = 'CLOSED';
  let failures = 0;
  let successes = 0;
  let lastFailureTime = 0;

  return async function <T>(fn: () => Promise<T>): Promise<T> {
    if (state === 'OPEN') {
      if (Date.now() - lastFailureTime > options.timeout) {
        state = 'HALF_OPEN';
        successes = 0;
      } else {
        throw new Error('Circuit is open');
      }
    }

    try {
      const result = await fn();
      if (state === 'HALF_OPEN') {
        successes++;
        if (successes >= options.successThreshold) {
          state = 'CLOSED';
          failures = 0;
        }
      } else {
        failures = 0;
      }
      return result;
    } catch (error) {
      failures++;
      if (failures >= options.failureThreshold) {
        state = 'OPEN';
        lastFailureTime = Date.now();
      }
      throw error;
    }
  };
}
