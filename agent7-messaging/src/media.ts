import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

type MediaMeta = {
	id: string;
	userId: string;
	filename: string;
	mimeType: string;
	size: number;
	createdAt: number;
	thumbnailPath?: string;
	filePath: string;
};

const UPLOAD_ROOT = path.resolve('/workspace/agent7-messaging/uploads');
const ORIG_DIR = path.join(UPLOAD_ROOT, 'original');
const THUMB_DIR = path.join(UPLOAD_ROOT, 'thumbs');

for (const dir of [UPLOAD_ROOT, ORIG_DIR, THUMB_DIR]) {
	try {
		fs.mkdirSync(dir, { recursive: true });
	} catch {}
}

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } }); // 200MB

const idToMedia = new Map<string, MediaMeta>();

export const mediaRouter = Router();

// Upload: expects form-data with fields: file (required), thumbnail (optional)
mediaRouter.post('/', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const file = (req.files as any)?.file?.[0];
	if (!file) return res.status(400).json({ error: 'missing_file' });
	const id = uuidv4();
	const ext = path.extname(file.originalname || '') || '';
	const filename = `${id}${ext}`;
	const filePath = path.join(ORIG_DIR, filename);
	try {
		fs.writeFileSync(filePath, file.buffer);
	} catch (e) {
		return res.status(500).json({ error: 'write_failed' });
	}

	let thumbnailPath: string | undefined;
	const thumb = (req.files as any)?.thumbnail?.[0];
	if (thumb) {
		const thumbName = `${id}.webp`;
		thumbnailPath = path.join(THUMB_DIR, thumbName);
		try { fs.writeFileSync(thumbnailPath, thumb.buffer); } catch {}
	}

	const meta: MediaMeta = {
		id,
		userId: req.user.userId,
		filename: file.originalname || filename,
		mimeType: file.mimetype || 'application/octet-stream',
		size: file.size || 0,
		createdAt: Date.now(),
		thumbnailPath,
		filePath,
	};
	idToMedia.set(id, meta);
	return res.json({ id, url: `/media/${id}`, thumbnailUrl: thumbnailPath ? `/media/${id}/thumbnail` : undefined });
});

// Stream original bytes, supports range requests
mediaRouter.get('/:id', async (req: Request, res: Response) => {
	const meta = idToMedia.get(req.params.id);
	if (!meta) return res.status(404).json({ error: 'not_found' });
	try {
		const stat = fs.statSync(meta.filePath);
		const total = stat.size;
		const range = req.headers.range;
		if (range) {
			const m = /^bytes=(\d+)-(\d+)?$/.exec(range);
			if (!m) return res.status(416).end();
			let start = parseInt(m[1], 10);
			let end = m[2] ? parseInt(m[2], 10) : total - 1;
			if (start >= total || end >= total || start > end) return res.status(416).end();
			const chunkSize = end - start + 1;
			res.writeHead(206, {
				'Content-Range': `bytes ${start}-${end}/${total}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunkSize,
				'Content-Type': meta.mimeType,
			});
			fs.createReadStream(meta.filePath, { start, end }).pipe(res);
			return;
		}
		res.writeHead(200, {
			'Content-Length': total,
			'Content-Type': meta.mimeType,
			'Accept-Ranges': 'bytes',
		});
		fs.createReadStream(meta.filePath).pipe(res);
	} catch (e) {
		return res.status(500).json({ error: 'stream_failed' });
	}
});

// Serve thumbnail if present
mediaRouter.get('/:id/thumbnail', (req: Request, res: Response) => {
	const meta = idToMedia.get(req.params.id);
	if (!meta || !meta.thumbnailPath) return res.status(404).json({ error: 'not_found' });
	try {
		const stat = fs.statSync(meta.thumbnailPath);
		res.writeHead(200, {
			'Content-Length': stat.size,
			'Content-Type': 'image/webp',
		});
		fs.createReadStream(meta.thumbnailPath).pipe(res);
	} catch {
		return res.status(500).json({ error: 'thumb_failed' });
	}
});

// Delete media (owner only)
mediaRouter.delete('/:id', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const meta = idToMedia.get(req.params.id);
	if (!meta) return res.status(404).json({ error: 'not_found' });
	if (meta.userId !== req.user.userId) return res.status(403).json({ error: 'forbidden' });
	try { fs.unlinkSync(meta.filePath); } catch {}
	if (meta.thumbnailPath) { try { fs.unlinkSync(meta.thumbnailPath); } catch {} }
	idToMedia.delete(req.params.id);
	return res.json({ ok: true });
});

// List current user's media
mediaRouter.get('/mine/list', (req: Request, res: Response) => {
	if (!req.user) return res.status(401).json({ error: 'unauthorized' });
	const list: Array<{ id: string; name: string; mimeType: string; size: number; createdAt: number; url: string; thumbnailUrl?: string }> = [];
	for (const item of idToMedia.values()) {
		if (item.userId !== req.user.userId) continue;
		list.push({
			id: item.id,
			name: item.filename,
			mimeType: item.mimeType,
			size: item.size,
			createdAt: item.createdAt,
			url: `/media/${item.id}`,
			thumbnailUrl: item.thumbnailPath ? `/media/${item.id}/thumbnail` : undefined,
		});
	}
	list.sort((a, b) => b.createdAt - a.createdAt);
	return res.json({ items: list });
});

