import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { config } from './config.js';
import { createS3Client } from './s3.js';

async function readBodyToBuffer(body: any): Promise<Buffer> {
	if (!body) return Buffer.alloc(0);
	if (typeof body.transformToByteArray === 'function') {
		const bytes = await body.transformToByteArray();
		return Buffer.from(bytes);
	}
	return new Promise((resolve, reject) => {
		const chunks: Buffer[] = [];
		body.on('data', (c: Buffer) => chunks.push(c));
		body.on('end', () => resolve(Buffer.concat(chunks)));
		body.on('error', reject);
	});
}

export async function generateAndUploadThumbnail(originalKey: string): Promise<{ thumbnailKey: string }> {
	if (!config.s3.bucket) throw new Error('S3_BUCKET not configured');
	const s3 = createS3Client();
	const get = await s3.send(new GetObjectCommand({ Bucket: config.s3.bucket, Key: originalKey }));
	const inputBuffer = await readBodyToBuffer(get.Body);
	const resized = await sharp(inputBuffer)
		.rotate()
		.resize({ width: config.thumbnail.maxDim, height: config.thumbnail.maxDim, fit: 'inside', withoutEnlargement: true })
		.toFormat(config.thumbnail.format)
		.toBuffer();

	const thumbKey = `${config.thumbnail.prefix.replace(/\/+$/,'')}/${originalKey}`;
	await s3.send(new PutObjectCommand({
		Bucket: config.s3.bucket,
		Key: thumbKey,
		Body: resized,
		ContentType: `image/${config.thumbnail.format}`,
		CacheControl: 'max-age=31536000, immutable',
	}));

	return { thumbnailKey: thumbKey };
}

