import type { SearchAdapter, SearchResult } from './search';
import type { MessageStub } from '../types/message';

let Typesense: any;
try { Typesense = require('typesense'); } catch {}

export class TypesenseAdapter implements SearchAdapter {
	private client: any;
	private collectionName = 'messages';

	constructor(private env: Record<string, string | undefined>) {
		if (!Typesense) throw new Error('typesense package not installed');
		this.client = new Typesense.Client({
			nodes: [{ host: env.TYPESENSE_HOST, port: Number(env.TYPESENSE_PORT || 8108), protocol: env.TYPESENSE_PROTOCOL || 'http' }],
			apiKey: env.TYPESENSE_API_KEY,
			connectionTimeoutSeconds: 2,
		});
	}

	async ensureSchema(): Promise<void> {
		const schema = {
			name: this.collectionName,
			fields: [
				{ name: 'id', type: 'string' },
				{ name: 'from', type: 'string', facet: true },
				{ name: 'to', type: 'string', facet: true },
				{ name: 'scope', type: 'string', facet: true },
				{ name: 'contentType', type: 'string', facet: true },
				{ name: 'timestamp', type: 'int64' },
				{ name: 'replyTo', type: 'string' },
				{ name: 'editedAt', type: 'int64' },
				{ name: 'deletedAt', type: 'int64' },
				{ name: 'tags', type: 'string[]', facet: true },
			],
			default_sorting_field: 'timestamp',
		};
		try {
			await this.client.collections(this.collectionName).retrieve();
		} catch {
			await this.client.collections().create(schema);
		}
	}

	async indexMessages(messages: MessageStub[]): Promise<{ indexed: number }> {
		if (messages.length === 0) return { indexed: 0 };
		await this.client.collections(this.collectionName).documents().import(messages, { action: 'upsert' });
		return { indexed: messages.length };
	}

	async search(params: { q: string; limit?: number }): Promise<{ hits: SearchResult[] }> {
		const res = await this.client.collections(this.collectionName).documents().search({
			q: params.q,
			query_by: 'from,to,scope,contentType,tags,replyTo',
			per_page: params.limit ?? 20,
		});
		const hits: SearchResult[] = (res.hits || []).map((h: any) => ({ id: h.document.id, score: h.text_match, fields: h.document }));
		return { hits };
	}
}

