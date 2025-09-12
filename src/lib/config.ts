import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
	APP_PORT: z.string().optional().default('3000'),
	APP_HOST: z.string().optional().default('0.0.0.0'),
	S3_ENDPOINT: z.string().optional(),
	S3_REGION: z.string().default('us-east-1'),
	S3_BUCKET: z.string().optional(),
	S3_ACCESS_KEY_ID: z.string().optional(),
	S3_SECRET_ACCESS_KEY: z.string().optional(),
	S3_FORCE_PATH_STYLE: z.string().optional(),
	S3_USE_SSL: z.string().optional(),
	PRESIGN_EXPIRES_SECONDS: z.string().optional().default('900'),
	THUMBNAIL_PREFIX: z.string().optional().default('thumbnails/'),
	THUMBNAIL_MAX_DIM: z.string().optional().default('512'),
	THUMBNAIL_FORMAT: z.string().optional().default('jpeg'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
	console.error('Invalid environment variables', parsed.error.flatten());
	process.exit(1);
}

const env = parsed.data;

export const config = {
	app: {
		port: Number(env.APP_PORT),
		host: env.APP_HOST,
	},
	s3: {
		endpoint: env.S3_ENDPOINT,
		region: env.S3_REGION,
		bucket: env.S3_BUCKET,
		accessKeyId: env.S3_ACCESS_KEY_ID,
		secretAccessKey: env.S3_SECRET_ACCESS_KEY,
		forcePathStyle: env.S3_FORCE_PATH_STYLE === 'true',
		useSSL: env.S3_USE_SSL !== 'false',
		signExpiresSeconds: Number(env.PRESIGN_EXPIRES_SECONDS),
	},
	thumbnail: {
		prefix: env.THUMBNAIL_PREFIX,
		maxDim: Number(env.THUMBNAIL_MAX_DIM),
		format: env.THUMBNAIL_FORMAT as 'jpeg' | 'png' | 'webp',
	},
} as const;

export type AppConfig = typeof config;

