-- Messaging persistence scaffolding (Postgres)
create table if not exists conversations (
  id text primary key,
  title text,
  participant_ids text[] not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id text primary key,
  conversation_id text references conversations(id) on delete cascade,
  sender_id text not null,
  scope text not null check (scope in ('direct','group')),
  ciphertext text not null,
  content_type text,
  timestamp_ms bigint not null,
  reply_to text,
  edited_at_ms bigint,
  deleted_at_ms bigint
);
