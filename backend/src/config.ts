export type AppConfig = {
  port: number;
  host: string;
  jwtSecret: string;
  dbPath: string;
  redisUrl?: string;
  otp: {
    length: number;
    ttlSeconds: number;
    resendSeconds: number;
    maxPerDay: number;
    maxVerifyAttempts: number;
    lockoutMinutes: number;
  };
  rateLimit: {
    globalMax: number;
    globalWindowMs: number;
  };
};

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function loadConfig(): AppConfig {
  return {
    port: toNumber(process.env.PORT, 4000),
    host: process.env.HOST || '0.0.0.0',
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    dbPath: process.env.DB_PATH || 'data.sqlite',
    redisUrl: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL,
    otp: {
      length: toNumber(process.env.OTP_LENGTH, 6),
      ttlSeconds: toNumber(process.env.OTP_TTL_SECONDS, 10 * 60),
      resendSeconds: toNumber(process.env.OTP_RESEND_SECONDS, 30),
      maxPerDay: toNumber(process.env.OTP_MAX_PER_DAY, 10),
      maxVerifyAttempts: toNumber(process.env.OTP_MAX_VERIFY_ATTEMPTS, 5),
      lockoutMinutes: toNumber(process.env.OTP_LOCKOUT_MINUTES, 15),
    },
    rateLimit: {
      globalMax: toNumber(process.env.RATE_LIMIT_MAX, 300),
      globalWindowMs: toNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    },
  };
}

export const config = loadConfig();

