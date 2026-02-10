-- Fix legacy `leaderboard_entries` schema.
--
-- The app expects a unique constraint on (user_id, period, mode) so it can upsert
-- both global and per-mode scores.
--
-- Run this against your Supabase Postgres database.

do $$
declare
  legacy_constraint_name text;
begin
  if to_regclass('public.leaderboard_entries') is null then
    raise notice 'public.leaderboard_entries does not exist (skipping)';
    return;
  end if;

  -- Drop legacy unique constraint exactly on (user_id, period) if present.
  select c.conname
    into legacy_constraint_name
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  where n.nspname = 'public'
    and t.relname = 'leaderboard_entries'
    and c.contype = 'u'
    and (
      select array_agg(att.attname order by att.attname)
      from unnest(c.conkey) as k(attnum)
      join pg_attribute att on att.attrelid = t.oid and att.attnum = k.attnum
    ) = array['period', 'user_id']
  limit 1;

  if legacy_constraint_name is not null then
    execute format(
      'alter table public.leaderboard_entries drop constraint %I',
      legacy_constraint_name
    );
  end if;

  -- Add expected unique constraint if missing.
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'leaderboard_entries'
      and c.contype in ('p', 'u')
      and (
        select array_agg(att.attname order by att.attname)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute att on att.attrelid = t.oid and att.attnum = k.attnum
      ) = array['mode', 'period', 'user_id']
  ) then
    alter table public.leaderboard_entries
      add constraint leaderboard_entries_user_period_mode_unique unique (user_id, period, mode);
  end if;
end $$;

