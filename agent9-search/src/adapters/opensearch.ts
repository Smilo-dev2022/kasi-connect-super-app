import type { SearchAdapter, SearchResult } from './search';
import type { MessageStub } from '../types/message';

let OS: any;
try { OS = require('@opensearch-project/opensearch'); } catch {}

export class OpenSearchAdapter implements SearchAdapter {
	private client: any;
	private indexName = 'messages';

	constructor(private env: Record<string, string | undefined>) {
		if (!OS) throw new Error('@opensearch-project/opensearch not installed');
		this.client = new OS.Client({
			node: env.OPENSEARCH_URL,
			auth: env.OPENSEARCH_USERNAME && env.OPENSEARCH_PASSWORD ? { username: env.OPENSEARCH_USERNAME, password: env.OPENSEARCH_PASSWORD } : undefined,
			ssl: { rejectUnauthorized: false },
		});
	}

	async ensureSchema(): Promise<void> {
		const exists = await this.client.indices.exists({ index: this.indexName });
		if (!exists.body) {
			await this.client.indices.create({ index: this.indexName, body: {
				mappings: {
					properties: {
						id: { type: 'keyword' },
						from: { type: 'keyword' },
						to: { type: 'keyword' },
						scope: { type: 'keyword' },
						contentType: { type: 'keyword' },
						timestamp: { type: 'date', format: 'epoch_millis' },
						replyTo: { type: 'keyword' },
						editedAt: { type: 'date', format: 'epoch_millis' },
						deletedAt: { type: 'date', format: 'epoch_millis' },
						tags: { type: 'keyword' },
					}
				}
			}});
		}
	}

	async indexMessages(messages: MessageStub[]): Promise<{ indexed: number }> {
		if (messages.length === 0) return { indexed: 0 };
		const body = messages.flatMap((m) => [{ index: { _index: this.indexName, _id: m.id } }, m]);
		await this.client.bulk({ refresh: true, body });
		return { indexed: messages.length };
	}

	async search(params: { q: string; limit?: number }): Promise<{ hits: SearchResult[] }> {
		const res = await this.client.search({ index: this.indexName, body: {
			query: {
				multi_match: {
					query: params.q,
					fields: ['from', 'to', 'scope', 'contentType', 'tags', 'replyTo']
				}
			}
		}, size: params.limit ?? 20 });
		const hits: SearchResult[] = res.body.hits.hits.map((h: any) => ({ id: h._id, score: h._score, fields: h._source }));
		return { hits };
	}
}

