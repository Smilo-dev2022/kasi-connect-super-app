export const config = {
  port: Number(process.env.PORT || 8081),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'devsecret',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  otpTtlSeconds: Number(process.env.OTP_TTL_SECONDS || 300),
  otpCooldownSeconds: Number(process.env.OTP_COOLDOWN_SECONDS || 60),
  otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS || 5),
  otpPepper: process.env.OTP_PEPPER || 'dev-otp-pepper-change-me',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
