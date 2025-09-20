// TODO: Implement a more robust cache, e.g., using Redis

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export function getCachedToken(): CachedToken | null {
  return cachedToken;
}

export function setCachedToken(token: string, expiresIn: number): void {
  cachedToken = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
