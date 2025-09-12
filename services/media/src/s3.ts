import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from './config';

export const s3Client = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint,
  forcePathStyle: config.s3.forcePathStyle,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

export async function presignPutObject(params: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: params.key,
    ContentType: params.contentType,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds ?? 900 });
  return url;
}

export async function presignGetObject(params: { key: string; expiresInSeconds?: number }): Promise<string> {
  const command = new GetObjectCommand({ Bucket: config.s3.bucket, Key: params.key });
  const url = await getSignedUrl(s3Client, command, { expiresIn: params.expiresInSeconds ?? 900 });
  return url;
}

export async function headObject(params: { key: string }) {
  const command = new HeadObjectCommand({ Bucket: config.s3.bucket, Key: params.key });
  return s3Client.send(command);
}

export async function getObject(params: { key: string }) {
  const command = new GetObjectCommand({ Bucket: config.s3.bucket, Key: params.key });
  return s3Client.send(command);
}

export async function ensureBucketExists(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: config.s3.bucket }));
  } catch (_err) {
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: config.s3.bucket }));
    } catch (createErr) {
      // eslint-disable-next-line no-console
      console.warn('Bucket check/create failed:', createErr);
    }
  }
}

