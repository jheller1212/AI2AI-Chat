-- Rate limiting for invite code redemption.
-- Tracks attempts per authenticated user within a rolling window.
-- Keyed on user_id (server-verified from the JWT) rather than IP, because
-- client-supplied headers (x-forwarded-for) are spoofable and a shared NAT
-- would otherwise lock out a whole classroom.
-- Applied via Supabase dashboard (not CLI).

create table if not exists public.invite_rate_limits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  code         text not null
);

-- Index for fast lookup by user within a time window
create index if not exists invite_rate_limits_user_time_idx
  on public.invite_rate_limits (user_id, attempted_at);

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
