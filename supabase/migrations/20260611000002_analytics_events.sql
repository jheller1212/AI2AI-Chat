-- ──────────────────────────────────────────────
-- First-party analytics: usage events + stopping-trigger persistence
-- Applied to the remote project on 2026-06-11; this file keeps the repo in sync.
-- ──────────────────────────────────────────────

-- Persist the final stopping trigger (keyword:<word> | turn_count) per conversation.
alter table public.conversations add column if not exists stopping_trigger text;

-- First-party event log. No third-party trackers; RLS-scoped to the owning user.
create table if not exists public.events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users on delete cascade not null,
  event_type text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- Users may write and read only their own events (matches the "own_*" policy
-- pattern used elsewhere). No update policy — events are append-only.
create policy "insert_own_events" on public.events
  for insert with check (auth.uid() = user_id);
create policy "select_own_events" on public.events
  for select using (auth.uid() = user_id);
create policy "delete_own_events" on public.events
  for delete using (auth.uid() = user_id);

create index if not exists events_type_time_idx on public.events (event_type, created_at desc);
create index if not exists events_user_idx on public.events (user_id, created_at desc);
