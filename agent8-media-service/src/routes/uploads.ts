import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { presignPutUrl } from '../lib/s3.js';
import { generateObjectKey } from '../lib/keys.js';

const allowedContentTypes = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/pdf',
]);

export async function registerUploadRoutes(app: FastifyInstance) {
	app.post('/uploads/presign', async (req, res) => {
		const schema = z.object({
			contentType: z.string(),
			filename: z.string().optional(),
			folder: z.string().optional(),
		});
		const body = schema.parse(req.body);

		if (!allowedContentTypes.has(body.contentType)) {
			return res.code(400).send({ error: 'Unsupported content type' });
		}

		const extFromContentType = body.contentType === 'application/pdf'
			? 'pdf'
			: body.contentType.split('/')[1];
		const filenameExt = body.filename?.split('.').pop();
		const extension = (filenameExt && filenameExt.length <= 6) ? filenameExt : extFromContentType;
		const key = generateObjectKey({ folder: body.folder, extension });
		const url = await presignPutUrl({ key, contentType: body.contentType });

		return { key, uploadUrl: url, requiredHeaders: { 'Content-Type': body.contentType } };
	});
}

