import { Pool, PoolClient } from 'pg';
import { getPool } from './db';

export type Conversation = { id: string; title?: string; created_at: string };
export type Message = { id: string; conversation_id: string; sender_id: string; type: string; body: any; created_at: string; edited_at?: string | null; deleted_at?: string | null };

export interface ConversationsRepo {
  create(title?: string): Promise<Conversation>;
  listByUser(userId: string): Promise<Conversation[]>;
  addMember(conversationId: string, userId: string, role: string): Promise<void>;
  removeMember(conversationId: string, userId: string): Promise<void>;
}

export interface MessagesRepo {
  create(conversationId: string, senderId: string, type: string, body: any, client?: PoolClient): Promise<Message>;
  listSince(conversationId: string, sinceIso: string | null, limit: number, cursor?: string | null): Promise<{ messages: (Message & { receipts: { user_id: string; status: string; at: string }[] })[]; next_cursor?: string | null }>;
  softDelete(messageId: string, byUser: string): Promise<void>;
  edit(messageId: string, body: any, byUser: string): Promise<void>;
  getMessageById(messageId: string): Promise<{ id: string; sender_id: string; conversation_id: string } | null>;
}

export interface ReceiptsRepo {
  upsert(messageId: string, userId: string, status: string, atIso: string): Promise<void>;
}

export function createRepos(pool?: Pool) {
  const p = pool || getPool();

  const conversations: ConversationsRepo = {
    async create(title?: string) {
      const r = await p.query<Conversation>('insert into conversations(id, title) values (gen_random_uuid(), $1) returning id, title, created_at', [title ?? null]);
      return r.rows[0];
    },
    async listByUser(userId: string) {
      const r = await p.query<Conversation>(
        'select c.id, c.title, c.created_at from conversations c join memberships m on m.conversation_id=c.id where m.user_id=$1 order by c.created_at desc',
        [userId]
      );
      return r.rows;
    },
    async addMember(conversationId: string, userId: string, role: string) {
      await p.query('insert into memberships(conversation_id, user_id, role) values ($1, $2, $3) on conflict do nothing', [conversationId, userId, role]);
    },
    async removeMember(conversationId: string, userId: string) {
      await p.query('delete from memberships where conversation_id=$1 and user_id=$2', [conversationId, userId]);
    }
  };

  const messages: MessagesRepo = {
    async create(conversationId: string, senderId: string, type: string, body: any, client?: PoolClient) {
      const q = 'insert into messages(id, conversation_id, sender_id, type, body) values (gen_random_uuid(), $1, $2, $3, $4) returning id, conversation_id, sender_id, type, body, created_at, edited_at, deleted_at';
      const params = [conversationId, senderId, type, body];
      const r = client ? await client.query<Message>(q, params) : await p.query<Message>(q, params);
      return r.rows[0];
    },
    async listSince(conversationId: string, sinceIso: string | null, limit: number, cursor?: string | null) {
      const after = sinceIso || cursor;
      const q = after
        ? `select m.id, m.conversation_id, m.sender_id, m.type, m.body, m.created_at, m.edited_at, m.deleted_at,
              coalesce(json_agg(json_build_object('user_id', r.user_id, 'status', r.status, 'at', r.at)) filter (where r.user_id is not null), '[]') as receipts
           from messages m left join receipts r on r.message_id=m.id
           where m.conversation_id=$1 and m.created_at > $2
           group by m.id
           order by m.created_at asc
           limit $3`
        : `select m.id, m.conversation_id, m.sender_id, m.type, m.body, m.created_at, m.edited_at, m.deleted_at,
              coalesce(json_agg(json_build_object('user_id', r.user_id, 'status', r.status, 'at', r.at)) filter (where r.user_id is not null), '[]') as receipts
           from messages m left join receipts r on r.message_id=m.id
           where m.conversation_id=$1
           group by m.id
           order by m.created_at asc
           limit $2`;
      const params = after ? [conversationId, after, limit] : [conversationId, limit];
      const r = await p.query<any>(q, params as any);
      const msgs = r.rows.map((row) => ({
        id: row.id,
        conversation_id: row.conversation_id,
        sender_id: row.sender_id,
        type: row.type,
        body: row.body,
        created_at: row.created_at,
        edited_at: row.edited_at,
        deleted_at: row.deleted_at,
        receipts: Array.isArray(row.receipts) ? row.receipts : []
      }));
      const next = msgs.length === limit ? (msgs[msgs.length - 1] as any).created_at : null;
      return { messages: msgs as any, next_cursor: next };
    },
    async softDelete(messageId: string, byUser: string) {
      await p.query('update messages set deleted_at=now() where id=$1', [messageId]);
    },
    async edit(messageId: string, body: any, byUser: string) {
      await p.query('update messages set body=$2, edited_at=now() where id=$1', [messageId, body]);
    }
    async getMessageById(messageId: string) {
      const r = await p.query('select id, sender_id, conversation_id from messages where id=$1', [messageId]);
      return r.rows[0] || null;
    }
  };

  const receipts: ReceiptsRepo = {
    async upsert(messageId: string, userId: string, status: string, atIso: string) {
      await p.query('insert into receipts(message_id, user_id, status, at) values ($1,$2,$3,$4) on conflict (message_id, user_id, status) do update set at=excluded.at', [messageId, userId, status, atIso]);
    }
  };

  return { conversations, messages, receipts } as const;
}

