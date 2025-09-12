import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, type HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config.js';

export function createS3Client(): S3Client {
	const s3 = new S3Client({
		region: config.s3.region,
		endpoint: config.s3.endpoint,
		forcePathStyle: config.s3.forcePathStyle,
		credentials: config.s3.accessKeyId && config.s3.secretAccessKey ? {
			accessKeyId: config.s3.accessKeyId,
			secretAccessKey: config.s3.secretAccessKey,
		} : undefined,
	});
	return s3;
}

export async function presignPutUrl(args: { key: string; contentType: string }): Promise<string> {
	if (!config.s3.bucket) throw new Error('S3_BUCKET not configured');
	const s3 = createS3Client();
	const command = new PutObjectCommand({
		Bucket: config.s3.bucket,
		Key: args.key,
		ContentType: args.contentType,
		CacheControl: 'max-age=31536000, immutable',
	});
	return getSignedUrl(s3, command, { expiresIn: config.s3.signExpiresSeconds });
}

export async function presignGetUrl(args: { key: string; responseContentType?: string }): Promise<string> {
	if (!config.s3.bucket) throw new Error('S3_BUCKET not configured');
	const s3 = createS3Client();
	const command = new GetObjectCommand({
		Bucket: config.s3.bucket,
		Key: args.key,
		ResponseContentType: args.responseContentType,
	});
	return getSignedUrl(s3, command, { expiresIn: config.s3.signExpiresSeconds });
}

export async function objectExists(key: string): Promise<boolean> {
	if (!config.s3.bucket) throw new Error('S3_BUCKET not configured');
	const s3 = createS3Client();
	try {
		await s3.send(new HeadObjectCommand({ Bucket: config.s3.bucket, Key: key }));
		return true;
	} catch (err: any) {
		if (err?.$metadata?.httpStatusCode === 404) return false;
		return false;
	}
}

export async function getObjectHead(key: string): Promise<HeadObjectCommandOutput | null> {
	if (!config.s3.bucket) throw new Error('S3_BUCKET not configured');
	const s3 = createS3Client();
	try {
		return await s3.send(new HeadObjectCommand({ Bucket: config.s3.bucket, Key: key }));
	} catch {
		return null;
	}
}

export async function listFiles(prefix?: string, maxKeys = 100) {
	if (!config.s3.bucket) throw new Error('S3_BUCKET not configured');
	const s3 = createS3Client();
	const result = await s3.send(new ListObjectsV2Command({ Bucket: config.s3.bucket, Prefix: prefix, MaxKeys: maxKeys }));
	return result.Contents ?? [];
}

