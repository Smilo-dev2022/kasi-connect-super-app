import { Router } from 'express';
import { z } from 'zod';
import { presignGetObject, getObject } from '../s3';

const router = Router();

router.get('/presign', async (req, res, next) => {
  try {
    const Query = z.object({ key: z.string(), expiresInSeconds: z.string().optional() });
    const q = Query.parse(req.query);
    const expires = q.expiresInSeconds ? Number(q.expiresInSeconds) : undefined;
    const url = await presignGetObject({ key: q.key, expiresInSeconds: expires });
    return res.json({ url, method: 'GET', key: q.key });
  } catch (err) {
    return next(err);
  }
});

router.get('/proxy', async (req, res, next) => {
  try {
    const Query = z.object({ key: z.string() });
    const q = Query.parse(req.query);
    const obj = await getObject({ key: q.key });

    if (obj.ContentType) res.setHeader('Content-Type', obj.ContentType);
    if (obj.ContentLength) res.setHeader('Content-Length', String(obj.ContentLength));
    if (obj.ETag) res.setHeader('ETag', obj.ETag);
    if (obj.LastModified) res.setHeader('Last-Modified', obj.LastModified.toUTCString());

    if (obj.Body) {
      const bodyStream = obj.Body as any;
      bodyStream.pipe(res);
      bodyStream.on('error', next);
    } else {
      res.status(404).end();
    }
  } catch (err) {
    return next(err);
  }
});

export default router;

