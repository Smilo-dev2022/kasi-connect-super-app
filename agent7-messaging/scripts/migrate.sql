-- Messaging persistence initial schema (Postgres)
create table if not exists conversations (
  id uuid primary key,
  title text null,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(conversation_id, user_id)
);

create table if not exists messages (
  id uuid primary key,
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null,
  type text not null,
  body jsonb not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz null,
  deleted_at timestamptz null
);
create index if not exists idx_messages_conv_created on messages(conversation_id, created_at);

create table if not exists receipts (
  message_id uuid not null references messages(id) on delete cascade,
  user_id uuid not null,
  status text not null,
  at timestamptz not null,
  unique(message_id, user_id, status)
);
