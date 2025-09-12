import { Router } from 'express';
import { z } from 'zod';
import mime from 'mime-types';
import { presignPutObject, headObject, presignGetObject } from '../s3';

const router = Router();

const allowedContentTypes = new Set<string>([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  // Documents
  'application/pdf',
  // Video (common)
  'video/mp4',
  'video/quicktime',
  'video/webm',
  // Audio (common)
  'audio/mpeg', // mp3
  'audio/mp4',
  'audio/aac',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
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
    const url = await presignPutObject({ key, contentType: body.contentType, expiresInSeconds: body.expiresInSeconds });
    return res.json({ url, method: 'PUT', key, headers: { 'Content-Type': body.contentType } });
  } catch (err) {
    return next(err);
  }
});

const ConfirmSchema = z.object({
  key: z.string(),
  returnPresignedGet: z.boolean().optional(),
  expiresInSeconds: z.number().int().min(60).max(3600).optional(),
});

router.post('/confirm', async (req, res, next) => {
  try {
    const body = ConfirmSchema.parse(req.body);
    const head = await headObject({ key: body.key });
    const response: any = {
      ok: true,
      key: body.key,
      contentType: head.ContentType || null,
      contentLength: head.ContentLength ?? null,
      etag: head.ETag || null,
      lastModified: head.LastModified ? head.LastModified.toISOString() : null,
    };
    if (body.returnPresignedGet) {
      response.getUrl = await presignGetObject({ key: body.key, expiresInSeconds: body.expiresInSeconds });
      response.method = 'GET';
    }
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

export default router;

