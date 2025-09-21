interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export function getCachedToken(): CachedToken | null {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken;
  }
  return null;
}

export function setCachedToken(token: string, expiresIn: number): void {
  cachedToken = {
    token,
    expiresAt: Date.now() + expiresIn * 1000,
  };
}
