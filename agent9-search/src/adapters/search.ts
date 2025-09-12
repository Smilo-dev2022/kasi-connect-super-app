import { MessageStub } from '../types/message';

export type SearchResult = { id: string; score?: number; fields: Record<string, unknown> };

export interface SearchAdapter {
	ensureSchema(): Promise<void>;
	indexMessages(messages: MessageStub[]): Promise<{ indexed: number }>;
	search(query: { q: string; limit?: number }): Promise<{ hits: SearchResult[] }>;
}

