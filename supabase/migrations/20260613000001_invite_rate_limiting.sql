-- Rate limiting for invite code redemption.
-- Tracks failed attempts per IP address within a rolling window.
-- Applied via Supabase dashboard (not CLI).

create table if not exists public.invite_rate_limits (
  id          uuid primary key default gen_random_uuid(),
  ip          text not null,
  attempted_at timestamptz not null default now(),
  code        text not null
);

-- Index for fast lookup by IP within a time window
create index if not exists invite_rate_limits_ip_time_idx
  on public.invite_rate_limits (ip, attempted_at);

-- RLS: service role only (no user-facing policies)
alter table public.invite_rate_limits enable row level security;

-- Auto-purge old entries (> 1 hour) to keep table small.
-- This can also be run as a scheduled job in Supabase.
create or replace function public.purge_old_invite_rate_limits()
returns void
language sql
security definer
as $$
  delete from public.invite_rate_limits
  where attempted_at < now() - interval '1 hour';
$$;
