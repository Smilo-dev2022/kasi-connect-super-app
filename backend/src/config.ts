import dotenv from 'dotenv';

dotenv.config();

const getEnv = (key: string, defaultValue?: string): string => {
  const val = process.env[key];
  if (val === undefined || val === '') {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Missing required env var ${key}`);
  }
  return val;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(getEnv('PORT', '4000')),
  postgresUrl: getEnv('POSTGRES_URL', 'postgres://postgres:postgres@localhost:5432/postgres'),
  redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
  jwtSecret: getEnv('JWT_SECRET', 'dev-insecure-secret-change-me'),
};

