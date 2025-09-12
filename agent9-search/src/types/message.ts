export type MessageStub = {
	id: string;
	from: string;
	to: string;
	scope: 'direct' | 'group';
	contentType?: string;
	timestamp: number;
	replyTo?: string;
	editedAt?: number;
	deletedAt?: number;
	tags?: string[];
};

