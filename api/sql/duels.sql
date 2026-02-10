-- Duels support (custom quiz + blitz duels).
--
-- Run this against your Supabase Postgres database.

do $$
begin
  begin
    create extension if not exists pgcrypto;
  exception
    when insufficient_privilege then
      null;
  end;

  -- duels
  if to_regclass('public.duels') is null then
    create table public.duels (
      id uuid primary key default gen_random_uuid(),
      mode text not null default 'custom',
      quiz_id uuid null,
      category_id uuid null,
      difficulty text null,
      challenger_user_id uuid not null,
      opponent_user_id uuid not null,
      challenger_session_id uuid not null,
      opponent_session_id uuid null,
      status text not null default 'pending',
      winner_user_id uuid null,
      started_at timestamptz null,
      current_index integer not null default 1,
      question_started_at timestamptz null,
      challenger_points integer not null default 0,
      opponent_points integer not null default 0,
      accepted_at timestamptz null,
      completed_at timestamptz null,
      created_at timestamptz not null default now(),
      summary_json jsonb not null default '{}'::jsonb
    );
  else
    alter table public.duels
      add column if not exists mode text not null default 'custom';

    alter table public.duels
      add column if not exists quiz_id uuid null;

    -- Blitz duels require quiz_id to be nullable.
    begin
      alter table public.duels alter column quiz_id drop not null;
    exception
      when undefined_column then null;
      when insufficient_privilege then null;
      when others then null;
    end;

    alter table public.duels
      add column if not exists category_id uuid null;

    alter table public.duels
      add column if not exists difficulty text null;

    alter table public.duels
      add column if not exists challenger_user_id uuid;

    alter table public.duels
      add column if not exists opponent_user_id uuid;

    alter table public.duels
      add column if not exists challenger_session_id uuid;

    alter table public.duels
      add column if not exists opponent_session_id uuid;

    alter table public.duels
      add column if not exists status text;

    alter table public.duels
      add column if not exists winner_user_id uuid;

    alter table public.duels
      add column if not exists started_at timestamptz;

    alter table public.duels
      add column if not exists current_index integer not null default 1;

    alter table public.duels
      add column if not exists question_started_at timestamptz;

    alter table public.duels
      add column if not exists challenger_points integer not null default 0;

    alter table public.duels
      add column if not exists opponent_points integer not null default 0;

    alter table public.duels
      add column if not exists accepted_at timestamptz;

    alter table public.duels
      add column if not exists completed_at timestamptz;

    alter table public.duels
      add column if not exists created_at timestamptz not null default now();

    alter table public.duels
      add column if not exists summary_json jsonb not null default '{}'::jsonb;
  end if;

  -- Basic check constraints (idempotent).
  if not exists (
    select 1 from pg_constraint
    where conname = 'duels_mode_check'
  ) then
    alter table public.duels
      add constraint duels_mode_check check (mode in ('custom', 'blitz'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'duels_status_check'
  ) then
    alter table public.duels
      add constraint duels_status_check check (status in ('pending', 'active', 'completed', 'declined', 'canceled'));
  end if;

  create index if not exists duels_challenger_idx on public.duels (challenger_user_id, created_at desc);
  create index if not exists duels_opponent_idx on public.duels (opponent_user_id, created_at desc);
  create index if not exists duels_status_idx on public.duels (status, created_at desc);

  -- duel_answers
  if to_regclass('public.duel_answers') is null then
    create table public.duel_answers (
      id uuid primary key default gen_random_uuid(),
      duel_id uuid not null,
      user_id uuid not null,
      question_index integer not null,
      session_option_id uuid not null,
      is_correct boolean not null,
      answered_ms integer not null default 0,
      created_at timestamptz not null default now(),
      constraint duel_answers_duel_user_q_unique unique (duel_id, user_id, question_index)
    );
  else
    alter table public.duel_answers
      add column if not exists user_id uuid;
    alter table public.duel_answers
      add column if not exists question_index integer;
    alter table public.duel_answers
      add column if not exists session_option_id uuid;
    alter table public.duel_answers
      add column if not exists is_correct boolean;
    alter table public.duel_answers
      add column if not exists answered_ms integer not null default 0;
    alter table public.duel_answers
      add column if not exists created_at timestamptz not null default now();

    if not exists (
      select 1 from pg_constraint where conname = 'duel_answers_duel_user_q_unique'
    ) then
      alter table public.duel_answers
        add constraint duel_answers_duel_user_q_unique unique (duel_id, user_id, question_index);
    end if;
  end if;

  create index if not exists duel_answers_duel_q_idx on public.duel_answers (duel_id, question_index);

  -- duel_claims
  if to_regclass('public.duel_claims') is null then
    create table public.duel_claims (
      duel_id uuid not null,
      question_index integer not null,
      winner_user_id uuid not null,
      answered_ms integer not null default 0,
      created_at timestamptz not null default now(),
      constraint duel_claims_pk primary key (duel_id, question_index)
    );
  else
    alter table public.duel_claims
      add column if not exists winner_user_id uuid;
    alter table public.duel_claims
      add column if not exists answered_ms integer not null default 0;
    alter table public.duel_claims
      add column if not exists created_at timestamptz not null default now();

    if not exists (
      select 1 from pg_constraint where conname = 'duel_claims_pk'
    ) then
      alter table public.duel_claims
        add constraint duel_claims_pk primary key (duel_id, question_index);
    end if;
  end if;

  create index if not exists duel_claims_duel_q_idx on public.duel_claims (duel_id, question_index);
end $$;
