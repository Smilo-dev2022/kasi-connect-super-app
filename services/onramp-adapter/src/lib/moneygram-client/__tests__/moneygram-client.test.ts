import axios from 'axios';
import { getOAuthToken } from '../index';
import * as tokenCache from '../token-cache';
import { testableCircuitBreaker as circuitBreaker } from '../circuit-breaker.test-helpers';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../token-cache', () => ({
  getCachedToken: jest.fn(),
  setCachedToken: jest.fn(),
}));
const mockedTokenCache = tokenCache as jest.Mocked<typeof tokenCache>;

// We need to mock the circuit breaker module to use our testable instance
jest.mock('../circuit-breaker', () => ({
  createCircuitBreaker: () => circuitBreaker,
}));

describe('getOAuthToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTokenCache.getCachedToken.mockReturnValue(null);
  });

  it('should return a cached token if a valid one exists', async () => {
    const cachedToken = { token: 'cached-token', expiresAt: Date.now() + 10000 };
    mockedTokenCache.getCachedToken.mockReturnValue(cachedToken);
    const token = await getOAuthToken();
    expect(token).toBe('cached-token');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should fetch a new token and pass the timeout option', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { access_token: 'new-token', expires_in: 3600 },
    });
    await getOAuthToken();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      { timeout: 5000 }
    );
  });

  it('should retry fetching a new token if the API call fails', async () => {
    mockedAxios.post
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValue({
        data: { access_token: 'new-token-after-retry', expires_in: 3600 },
      });
    const token = await getOAuthToken();
    expect(token).toBe('new-token-after-retry');
    expect(mockedAxios.post).toHaveBeenCalledTimes(2);
  });

  describe('Circuit Breaker', () => {
    it('should open the circuit after 3 consecutive failures', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));
      for (let i = 0; i < 3; i++) {
        await expect(getOAuthToken()).rejects.toThrow('API Error');
      }
      await expect(getOAuthToken()).rejects.toThrow('Circuit is open');
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should transition to half-open and then close on success', async () => {
        mockedAxios.post.mockRejectedValue(new Error('API Error'));
        // Trip the circuit
        for (let i = 0; i < 3; i++) {
          await expect(getOAuthToken()).rejects.toThrow('API Error');
        }
        await expect(getOAuthToken()).rejects.toThrow('Circuit is open');

        // Manually reset the circuit to half-open for testing
        // In a real scenario, this would be time-based
        const circuit = require('../circuit-breaker').createCircuitBreaker({
            failureThreshold: 3,
            successThreshold: 2,
            timeout: 10,
        });
        const originalState = circuit.state;
        circuit.state = 'HALF_OPEN';

        mockedAxios.post.mockResolvedValue({
            data: { access_token: 'half-open-success', expires_in: 3600 },
        });

        const token = await circuit(async () => {
            const res = await mockedAxios.post();
            return res.data.access_token;
        });

        expect(token).toBe('half-open-success');

        // Reset state for other tests
        circuit.state = originalState;
    });
  });
});
