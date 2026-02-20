-- Blitz matchmaking queue (async duels).
--
-- Purpose:
-- - Allow players to press "Find a game" in Blitz (random or category-specific).
-- - Server matches two queued players with same (difficulty, category_id) and creates a blitz duel.
--
-- Safe to run multiple times.

do $$
begin
  begin
    create extension if not exists pgcrypto;
  exception
    when insufficient_privilege then
      null;
  end;

  if to_regclass('public.blitz_matchmaking_queue') is null then
    create table public.blitz_matchmaking_queue (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      category_id uuid null,
      difficulty text not null,
      status text not null default 'queued',
      duel_id uuid null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  else
    alter table public.blitz_matchmaking_queue
      add column if not exists user_id uuid;
    alter table public.blitz_matchmaking_queue
      add column if not exists category_id uuid;
    alter table public.blitz_matchmaking_queue
      add column if not exists difficulty text;
    alter table public.blitz_matchmaking_queue
      add column if not exists status text;
    alter table public.blitz_matchmaking_queue
      add column if not exists duel_id uuid;
    alter table public.blitz_matchmaking_queue
      add column if not exists created_at timestamptz not null default now();
    alter table public.blitz_matchmaking_queue
      add column if not exists updated_at timestamptz not null default now();
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'blitz_matchmaking_queue_difficulty_check'
  ) then
    alter table public.blitz_matchmaking_queue
      add constraint blitz_matchmaking_queue_difficulty_check check (difficulty in ('easy', 'medium', 'hard'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'blitz_matchmaking_queue_status_check'
  ) then
    alter table public.blitz_matchmaking_queue
      add constraint blitz_matchmaking_queue_status_check check (status in ('queued', 'matching', 'matched', 'canceled'));
  end if;

  create index if not exists blitz_matchmaking_queue_lookup_idx
    on public.blitz_matchmaking_queue (difficulty, category_id, status, created_at asc);

  create index if not exists blitz_matchmaking_queue_user_idx
    on public.blitz_matchmaking_queue (user_id, status, created_at desc);

  -- Ensure one active queued/matching request per user (best-effort).
  begin
    create unique index if not exists blitz_matchmaking_queue_one_active_per_user
      on public.blitz_matchmaking_queue (user_id)
      where status in ('queued', 'matching');
  exception
    when insufficient_privilege then
      null;
    when others then
      null;
  end;
end $$;

