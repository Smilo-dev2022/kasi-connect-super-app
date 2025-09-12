import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { mediaIdToMeta } from './state';

export const mediaRouter = Router();

const UploadUrlBody = z.object({ kind: z.enum(['image','video','audio','file']), mime: z.string().optional(), size: z.number().int().positive().optional() });

// For dev: we return a local path to PUT the file to (no auth) and store its meta
mediaRouter.post('/upload-url', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = UploadUrlBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const id = uuidv4();
	const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
	fs.mkdirSync(uploadsDir, { recursive: true });
	const filePath = path.join(uploadsDir, `${id}`);
	mediaIdToMeta.set(id, { id, kind: parsed.data.kind, mime: parsed.data.mime, size: parsed.data.size, originalPath: filePath, status: 'pending', createdAt: Date.now() });
	const uploadUrl = `/media/dev-upload/${id}`; // local dev endpoint
	return res.json({ upload_url: uploadUrl, media_id: id });
});

// Dev upload acceptor
mediaRouter.put('/dev-upload/:id', (req: Request, res: Response) => {
	const id = req.params.id;
	const meta = mediaIdToMeta.get(id);
	if (!meta || !meta.originalPath) return res.status(404).json({ error: 'not_found' });
	const stream = fs.createWriteStream(meta.originalPath);
	req.pipe(stream);
	stream.on('finish', () => {
		meta.status = 'ready';
		mediaIdToMeta.set(id, meta);
		return res.status(201).json({ ok: true, id });
	});
	stream.on('error', () => res.status(500).json({ error: 'write_failed' }));
});

const CompleteBody = z.object({ media_id: z.string().min(1) });
mediaRouter.post('/complete', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const parsed = CompleteBody.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const meta = mediaIdToMeta.get(parsed.data.media_id);
	if (!meta) return res.status(404).json({ error: 'not_found' });
	// In a real system, trigger async processing to create thumbs and transcodes.
	return res.status(202).json({ ok: true });
});

// Thumb proxy (returns the same file for now)
mediaRouter.get('/:id/thumb', (req: Request, res: Response) => {
	const id = req.params.id;
	const meta = mediaIdToMeta.get(id);
	if (!meta) return res.status(404).json({ error: 'not_found' });
	const file = meta.thumbPath || meta.originalPath;
	if (!file || !fs.existsSync(file)) return res.status(404).json({ error: 'not_found' });
	return res.sendFile(path.resolve(file));
});

