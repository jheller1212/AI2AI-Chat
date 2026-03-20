create table if not exists public.workshops (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  welcome     text not null default '',
  api_key     text not null,
  provider    text not null default 'gpt4',
  scenario    jsonb,
  config      jsonb,
  active      boolean not null default true,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

alter table public.workshops enable row level security;
-- No RLS policies = only service role (edge functions) can access.
