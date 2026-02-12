-- Story pool ordering support.
--
-- Adds a `created_at` column so admin pool UIs can show recently-added
-- questions first (stable pagination).
--
-- Run this against your Supabase Postgres database.

do $$
begin
  if to_regclass('public.story_level_pool') is null then
    raise notice 'public.story_level_pool does not exist (skipping)';
    return;
  end if;

  alter table public.story_level_pool
    add column if not exists created_at timestamptz not null default now();

  -- Backfill for existing rows (best-effort).
  begin
    update public.story_level_pool
    set created_at = coalesce(created_at, now());
  exception
    when insufficient_privilege then null;
    when others then null;
  end;

  create index if not exists story_level_pool_level_created_idx
    on public.story_level_pool (level_id, created_at desc);
end $$;

