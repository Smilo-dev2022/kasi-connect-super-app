import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { z } from 'zod';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  forcePathStyle: String(process.env.S3_FORCE_PATH_STYLE || 'true') === 'true',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
});

const BUCKET = process.env.S3_BUCKET || 'media';

async function ensureBucket() {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
  } catch (err) {
    try { await s3.send(new CreateBucketCommand({ Bucket: BUCKET })); } catch {}
  }
}

export default async function mediaPlugin(app: FastifyInstance, _opts: FastifyPluginOptions) {
  await ensureBucket();

  const PresignPutBody = z.object({
    contentType: z.string(),
    fileName: z.string().optional(),
    key: z.string().optional(),
    folder: z.string().optional(),
    expiresInSeconds: z.number().int().min(60).max(3600).optional(),
  });

  function generateKey(params: { fileName?: string; contentType: string; folder?: string }): string {
    const safeFolder = params.folder ? params.folder.replace(/^\/+|\/+$/g, '') + '/' : '';
    const base = params.fileName?.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext = (params.contentType.split('/')[1] || 'bin');
    const withExt = base ? (base.includes('.') ? base : `${base}.${ext}`) : `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
    return `${safeFolder}${Date.now()}-${Math.random().toString(36).slice(2,8)}-${withExt}`;
  }

  app.post('/uploads/presign', async (request, reply) => {
    const parsed = PresignPutBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const body = parsed.data;
    const key = body.key ?? generateKey({ fileName: body.fileName, contentType: body.contentType, folder: body.folder });
    const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: body.contentType }), { expiresIn: body.expiresInSeconds ?? 900 });
    return reply.send({ url, method: 'PUT', key, headers: { 'Content-Type': body.contentType } });
  });

  app.get('/media/presign', async (request, reply) => {
    const q = (request.query || {}) as { key?: string; expiresInSeconds?: string };
    if (!q.key) return reply.code(400).send({ error: 'key required' });
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: q.key }), { expiresIn: q.expiresInSeconds ? Number(q.expiresInSeconds) : 900 });
    return reply.send({ url, method: 'GET', key: q.key });
  });
}
