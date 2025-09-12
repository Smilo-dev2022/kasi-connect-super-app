import { Router } from 'express';
import { z } from 'zod';
import sharp from 'sharp';
import { getObject, headObject } from '../s3';

const router = Router();

const QuerySchema = z.object({
  key: z.string(),
  w: z.string().optional(),
  h: z.string().optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).optional(),
  format: z.enum(['webp', 'jpeg', 'png', 'avif']).optional(),
  q: z.string().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const q = QuerySchema.parse(req.query);
    const width = q.w ? Math.max(1, Math.min(4096, parseInt(q.w, 10))) : undefined;
    const height = q.h ? Math.max(1, Math.min(4096, parseInt(q.h, 10))) : undefined;
    const fit = q.fit ?? 'cover';
    const format = q.format ?? 'webp';
    const quality = q.q ? Math.max(1, Math.min(100, parseInt(q.q, 10))) : 80;

    const head = await headObject({ key: q.key });
    const contentType = head.ContentType || '';
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only images supported for thumbnails' });
    }

    const obj = await getObject({ key: q.key });
    if (!obj.Body) return res.status(404).end();
    const bodyStream = obj.Body as any;

    const transformer = sharp().rotate().resize({ width, height, fit });
    let output = transformer;
    switch (format) {
      case 'jpeg':
        output = transformer.jpeg({ quality, mozjpeg: true });
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case 'png':
        output = transformer.png();
        res.setHeader('Content-Type', 'image/png');
        break;
      case 'avif':
        output = transformer.avif({ quality });
        res.setHeader('Content-Type', 'image/avif');
        break;
      default:
        output = transformer.webp({ quality });
        res.setHeader('Content-Type', 'image/webp');
    }

    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    bodyStream.pipe(output).pipe(res).on('error', next);
  } catch (err) {
    return next(err);
  }
});

export default router;

