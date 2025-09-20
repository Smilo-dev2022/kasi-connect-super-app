import axios from 'axios';
import { getOAuthToken } from '../index';
import * as tokenCache from '../token-cache';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../token-cache', () => ({
  getCachedToken: jest.fn(),
  setCachedToken: jest.fn(),
}));
const mockedTokenCache = tokenCache as jest.Mocked<typeof tokenCache>;

describe('getOAuthToken', () => {
  beforeEach(() => {
    // Reset mocks before each test to ensure a clean slate
    jest.clearAllMocks();
    // Mock the cache to be empty by default
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

      // First 3 calls should fail and trigger the circuit to open
      await expect(getOAuthToken()).rejects.toThrow('API Error');
      await expect(getOAuthToken()).rejects.toThrow('API Error');
      await expect(getOAuthToken()).rejects.toThrow('API Error');

      // The 4th call should be rejected immediately by the circuit breaker
      await expect(getOAuthToken()).rejects.toThrow('Circuit is open');

      // Axios should have only been called 3 times
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('should transition to half-open and then close on success', async () => {
        jest.useFakeTimers();
        mockedAxios.post.mockRejectedValue(new Error('API Error'));

        // Trip the circuit
        for (let i = 0; i < 3; i++) {
          await expect(getOAuthToken()).rejects.toThrow('API Error');
        }
        await expect(getOAuthToken()).rejects.toThrow('Circuit is open');

        // Move time forward to allow the circuit to enter half-open state
        jest.advanceTimersByTime(10001);

        // Mock a successful call
        mockedAxios.post.mockResolvedValue({
            data: { access_token: 'half-open-success', expires_in: 3600 },
        });

        // This call should succeed
        const token1 = await getOAuthToken();
        expect(token1).toBe('half-open-success');

        // Another successful call to close the circuit
        const token2 = await getOAuthToken();
        expect(token2).toBe('half-open-success');

        jest.useRealTimers();
    });
  });
});
