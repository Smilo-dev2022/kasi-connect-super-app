import * as dotenv from 'dotenv';
dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: numberFromEnv(process.env.PORT, 4010),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: numberFromEnv(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: numberFromEnv(process.env.REDIS_DB, 0),
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'auth:'
  },

  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET || 'dev-access-secret',
    refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
    accessTokenTtlSeconds: numberFromEnv(process.env.JWT_ACCESS_TTL_SECONDS, 900), // 15m
    refreshTokenTtlSeconds: numberFromEnv(process.env.JWT_REFRESH_TTL_SECONDS, 60 * 60 * 24 * 7) // 7d
  },

  otp: {
    codeTtlSeconds: numberFromEnv(process.env.OTP_CODE_TTL_SECONDS, 300), // 5m
    maxRequestsPerHour: numberFromEnv(process.env.OTP_MAX_REQUESTS_PER_HOUR, 5)
  },
} as const;

