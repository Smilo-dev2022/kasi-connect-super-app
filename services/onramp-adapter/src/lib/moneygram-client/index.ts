import axios from 'axios';
import { getCachedToken, setCachedToken } from './token-cache';
import { retry } from './retries';
import { createCircuitBreaker } from './circuit-breaker';

const MONEYGRAM_API_URL = 'https://api.moneygram.com'; // Placeholder
const CLIENT_ID = process.env.MONEYGRAM_CLIENT_ID || 'dummy-client-id';
const CLIENT_SECRET = process.env.MONEYGRAM_CLIENT_SECRET || 'dummy-client-secret';

const circuitBreaker = createCircuitBreaker({
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 10000, // 10 seconds
});

/**
 * Fetches a new OAuth token from the MoneyGram API.
 */
async function fetchNewToken(): Promise<string> {
  try {
    const response = await axios.post(
      `${MONEYGRAM_API_URL}/oauth/token`,
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
      },
      { timeout: 5000 }
    );

    const { access_token, expires_in } = response.data;
    setCachedToken(access_token, expires_in);
    return access_token;
  } catch (error) {
    console.error('Failed to fetch new MoneyGram token:', error);
    throw error;
  }
}

/**
 * Retrieves an OAuth token from MoneyGram.
 * It will first check the cache, and if the token is expired or not present,
 * it will fetch a new one, with retries and a circuit breaker.
 */
export async function getOAuthToken(): Promise<string> {
  const cached = getCachedToken();
  if (cached) {
    return cached.token;
  }

  const fetchWithRetry = () => retry(() => circuitBreaker(fetchNewToken), 3, 1000);
  return fetchWithRetry();
}
