-- Fix `leaderboard_entries_mode_check` to allow new leaderboard modes.
--
-- Some deployments created `leaderboard_entries.mode` with a CHECK constraint that only allows
-- legacy values (e.g. 'blitz' but not 'blitz_easy', 'blitz_medium', 'blitz_hard').
-- This script drops and recreates the constraint with the full, current set.
--
-- Safe to run multiple times.

do $$
begin
  if to_regclass('public.leaderboard_entries') is null then
    raise notice 'public.leaderboard_entries does not exist (skipping)';
    return;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.leaderboard_entries'::regclass
      and conname = 'leaderboard_entries_mode_check'
  ) then
    execute 'alter table public.leaderboard_entries drop constraint leaderboard_entries_mode_check';
  end if;

  execute $sql$
    alter table public.leaderboard_entries
      add constraint leaderboard_entries_mode_check
      check (
        mode in (
          'global',
          'story',
          'classic',
          'blitz',
          'blitz_easy',
          'blitz_medium',
          'blitz_hard',
          'millionaire',
          'custom'
        )
      )
  $sql$;
end $$;

