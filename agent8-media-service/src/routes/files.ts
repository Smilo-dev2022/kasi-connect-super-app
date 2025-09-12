import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { config } from '../lib/config.js';
import { createS3Client, listFiles as s3List, presignGetUrl, objectExists, getObjectHead } from '../lib/s3.js';
import { generateAndUploadThumbnail } from '../lib/thumbnail.js';
import { HeadObjectCommand } from '@aws-sdk/client-s3';

export async function registerFileRoutes(app: FastifyInstance) {
	app.get('/files', async (req, res) => {
		const query = z.object({ prefix: z.string().optional(), max: z.coerce.number().int().positive().max(1000).optional() }).parse(req.query);
		const objects = await s3List(query.prefix, query.max ?? 100);
		return objects.map(o => ({ key: o.Key, size: o.Size, lastModified: o.LastModified }));
	});

	app.get('/files/url', async (req, res) => {
		const query = z.object({ key: z.string() }).parse(req.query);
		const url = await presignGetUrl({ key: query.key });
		return { url };
	});

	app.get('/thumbnails/url', async (req, res) => {
		const query = z.object({ key: z.string() }).parse(req.query);
		const exists = await objectExists(`${config.thumbnail.prefix.replace(/\/+$/,'')}/${query.key}`);
		let generated = false;
		if (!exists) {
			const head = await getObjectHead(query.key);
			const ct = head?.ContentType ?? '';
			if (ct.startsWith('image/')) {
				await generateAndUploadThumbnail(query.key);
				generated = true;
			} else {
				return res.code(400).send({ error: 'Thumbnails supported only for images' });
			}
		}
		const thumbKey = `${config.thumbnail.prefix.replace(/\/+$/,'')}/${query.key}`;
		const url = await presignGetUrl({ key: thumbKey, responseContentType: `image/${config.thumbnail.format}` });
		return { url, generated };
	});

	app.get('/files/head', async (req, res) => {
		const query = z.object({ key: z.string() }).parse(req.query);
		const s3 = createS3Client();
		const head = await s3.send(new HeadObjectCommand({ Bucket: config.s3.bucket!, Key: query.key }));
		return { contentType: head.ContentType, contentLength: head.ContentLength, lastModified: head.LastModified };
	});
}

