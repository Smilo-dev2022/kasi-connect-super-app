import { randomUUID } from 'crypto';

function pad2(n: number) {
	return n.toString().padStart(2, '0');
}

export function generateObjectKey(args: { folder?: string; extension?: string }) {
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = pad2(now.getUTCMonth() + 1);
	const day = pad2(now.getUTCDate());
	const uuid = randomUUID();
	const cleanFolder = args.folder ? args.folder.replace(/^\/+|\/+$/g, '') + '/' : '';
	const cleanExt = args.extension ? (args.extension.startsWith('.') ? args.extension : `.${args.extension}`) : '';
	return `${cleanFolder}uploads/${year}/${month}/${day}/${uuid}${cleanExt}`;
}

export function thumbnailKeyFor(originalKey: string, prefix: string) {
	const cleanPrefix = prefix.replace(/^\/+|\/+$/g, '');
	return `${cleanPrefix}/${originalKey}`;
}

