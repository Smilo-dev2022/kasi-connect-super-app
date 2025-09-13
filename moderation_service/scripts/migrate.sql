-- Moderation schema
create extension if not exists pgcrypto;

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid,
  target_type text not null,
  target_id uuid,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_reports_status_created on reports(status, created_at desc);

create table if not exists queue (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  assigned_to uuid null,
  state text not null default 'queued',
  created_at timestamptz not null default now()
);
create index if not exists idx_queue_state_created on queue(state, created_at desc);

create table if not exists actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  actor_id uuid not null,
  action text not null,
  notes text,
  created_at timestamptz not null default now()
);
