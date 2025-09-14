import { Router } from 'express';
import { z } from 'zod';
import mime from 'mime-types';
import { presignPutObject } from '../s3';
import { performance } from 'node:perf_hooks';

const router = Router();

const allowedContentTypes = new Set<string>([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'application/pdf',
]);

const BodySchema = z.object({
  contentType: z.string(),
  fileName: z.string().optional(),
  key: z.string().optional(),
  folder: z.string().optional(),
  expiresInSeconds: z.number().int().min(60).max(3600).optional(),
});

function generateKey(params: { fileName?: string; contentType: string; folder?: string }): string {
  const ext = (mime.extension(params.contentType) || 'bin').toString();
  const safeFolder = params.folder ? params.folder.replace(/^\/+|\/+$/g, '') + '/' : '';
  if (params.fileName) {
    const base = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const withExt = base.includes('.') ? base : `${base}.${ext}`;
    return `${safeFolder}${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${withExt}`;
  }
  return `${safeFolder}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

router.post('/presign', async (req, res, next) => {
  try {
    const body = BodySchema.parse(req.body);
    if (!allowedContentTypes.has(body.contentType)) {
      return res.status(400).json({ error: 'Unsupported contentType' });
    }
    const key = body.key ?? generateKey({ fileName: body.fileName, contentType: body.contentType, folder: body.folder });
    const t0 = performance.now();
    try {
      const url = await presignPutObject({ key, contentType: body.contentType, expiresInSeconds: body.expiresInSeconds });
      (global as any).__media_upload_success = ((global as any).__media_upload_success || 0) + 1;
      (global as any).__media_latencies = ((global as any).__media_latencies || []);
      (global as any).__media_latencies.push(performance.now() - t0);
      return res.json({ url, method: 'PUT', key, headers: { 'Content-Type': body.contentType } });
    } catch (e) {
      (global as any).__media_upload_failure = ((global as any).__media_upload_failure || 0) + 1;
      throw e;
    }
  } catch (err) {
    return next(err);
  }
});

export default router;

