import * as dotenv from 'dotenv';
dotenv.config();

const numberFromEnv = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: numberFromEnv(process.env.PORT, 4008),
  corsOrigin: process.env.CORS_ORIGIN || '*',

  s3: {
    endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
    region: process.env.S3_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.MINIO_ROOT_USER || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    bucket: process.env.S3_BUCKET || 'media',
    forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || 'true') === 'true'
  },
} as const;

