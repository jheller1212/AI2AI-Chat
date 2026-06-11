-- Atomic experiment run-count increment.
-- Replaces the client-side read-then-write, which was racy and unawaited.
-- SECURITY INVOKER so the caller's RLS ("own_experiments") still applies.
create or replace function public.increment_experiment_run_count(exp_id uuid)
returns void
language sql
security invoker
as $$
  update public.experiments
  set run_count = run_count + 1,
      last_run_at = now()
  where id = exp_id;
$$;

-- workshop-config upserts with onConflict 'user_id,workshop_code', which
-- requires a real unique constraint. Dedupe existing rows (keep oldest), then add it.
delete from workshop_signups a
  using workshop_signups b
  where a.user_id = b.user_id
    and a.workshop_code = b.workshop_code
    and a.id <> b.id
    and (a.created_at > b.created_at
         or (a.created_at = b.created_at and a.id > b.id));

alter table workshop_signups
  add constraint workshop_signups_user_workshop_unique unique (user_id, workshop_code);
