-- Global question assignment flag (quiz_questions.is_assigned)
--
-- Adds a boolean `is_assigned` flag to `public.quiz_questions` and keeps it in sync
-- via triggers on pool tables:
-- - public.story_level_pool
-- - public.classic_category_pool
-- - public.mode_question_pool
--
-- This fixes cases where the admin UI can't reliably determine "assigned vs unassigned"
-- from large ID lists (pagination/limits).
--
-- Run this against your Supabase Postgres database.

do $$
declare
  has_story boolean;
  has_classic boolean;
  has_mode boolean;
  expr text := 'false';
begin
  if to_regclass('public.quiz_questions') is null then
    raise notice 'public.quiz_questions does not exist (skipping)';
    return;
  end if;

  alter table public.quiz_questions
    add column if not exists is_assigned boolean not null default false;

  has_story := to_regclass('public.story_level_pool') is not null;
  has_classic := to_regclass('public.classic_category_pool') is not null;
  has_mode := to_regclass('public.mode_question_pool') is not null;
  -- New classic per-level pool
  if to_regclass('public.classic_category_level_pool') is not null then
    expr := expr || ' or exists (select 1 from public.classic_category_level_pool p where p.quiz_question_id = q.id)';
  end if;

  -- Backfill current assignment state (best-effort).
  if has_story then
    expr := expr || ' or exists (select 1 from public.story_level_pool p where p.quiz_question_id = q.id)';
  end if;
  if has_classic then
    expr := expr || ' or exists (select 1 from public.classic_category_pool p where p.quiz_question_id = q.id)';
  end if;
  if has_mode then
    expr := expr || ' or exists (select 1 from public.mode_question_pool p where p.quiz_question_id = q.id)';
  end if;

  execute 'update public.quiz_questions q set is_assigned = (' || expr || ')';
end $$;

create or replace function public.tv_compute_question_is_assigned(p_question_id uuid)
returns boolean
language plpgsql
as $$
declare
  assigned boolean := false;
begin
  if p_question_id is null then
    return false;
  end if;

  -- story pool
  if to_regclass('public.story_level_pool') is not null then
    execute
      'select exists (select 1 from public.story_level_pool where quiz_question_id = $1 limit 1)'
      into assigned
      using p_question_id;
    if assigned then
      return true;
    end if;
  end if;

  -- classic category pool
  if to_regclass('public.classic_category_pool') is not null then
    execute
      'select exists (select 1 from public.classic_category_pool where quiz_question_id = $1 limit 1)'
      into assigned
      using p_question_id;
    if assigned then
      return true;
    end if;
  end if;

  -- classic category level pool
  if to_regclass('public.classic_category_level_pool') is not null then
    execute
      'select exists (select 1 from public.classic_category_level_pool where quiz_question_id = $1 limit 1)'
      into assigned
      using p_question_id;
    if assigned then
      return true;
    end if;
  end if;

  -- mode pool
  if to_regclass('public.mode_question_pool') is not null then
    execute
      'select exists (select 1 from public.mode_question_pool where quiz_question_id = $1 limit 1)'
      into assigned
      using p_question_id;
    if assigned then
      return true;
    end if;
  end if;

  return false;
end;
$$;

create or replace function public.tv_refresh_question_is_assigned(p_question_id uuid)
returns void
language plpgsql
as $$
declare
  assigned boolean;
begin
  if p_question_id is null then
    return;
  end if;

  assigned := public.tv_compute_question_is_assigned(p_question_id);

  update public.quiz_questions
  set is_assigned = assigned
  where id = p_question_id;
end;
$$;

create or replace function public.tv_pool_refresh_question_is_assigned()
returns trigger
language plpgsql
as $$
declare
  qid uuid;
begin
  if tg_op = 'DELETE' then
    qid := old.quiz_question_id;
  else
    qid := new.quiz_question_id;
  end if;

  perform public.tv_refresh_question_is_assigned(qid);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
begin
  -- story_level_pool triggers
  if to_regclass('public.story_level_pool') is not null then
    if not exists (select 1 from pg_trigger where tgname = 'tv_story_level_pool_refresh_assigned_trg') then
      execute '
        create trigger tv_story_level_pool_refresh_assigned_trg
        after insert or update or delete on public.story_level_pool
        for each row
        execute function public.tv_pool_refresh_question_is_assigned()
      ';
    end if;
  end if;

  -- classic_category_pool triggers
  if to_regclass('public.classic_category_pool') is not null then
    if not exists (select 1 from pg_trigger where tgname = 'tv_classic_category_pool_refresh_assigned_trg') then
      execute '
        create trigger tv_classic_category_pool_refresh_assigned_trg
        after insert or update or delete on public.classic_category_pool
        for each row
        execute function public.tv_pool_refresh_question_is_assigned()
      ';
    end if;
  end if;

  -- classic_category_level_pool triggers (new)
  if to_regclass('public.classic_category_level_pool') is not null then
    if not exists (select 1 from pg_trigger where tgname = 'tv_classic_category_level_pool_refresh_assigned_trg') then
      execute '
        create trigger tv_classic_category_level_pool_refresh_assigned_trg
        after insert or update or delete on public.classic_category_level_pool
        for each row
        execute function public.tv_pool_refresh_question_is_assigned()
      ';
    end if;
  end if;

  -- mode_question_pool triggers
  if to_regclass('public.mode_question_pool') is not null then
    if not exists (select 1 from pg_trigger where tgname = 'tv_mode_question_pool_refresh_assigned_trg') then
      execute '
        create trigger tv_mode_question_pool_refresh_assigned_trg
        after insert or update or delete on public.mode_question_pool
        for each row
        execute function public.tv_pool_refresh_question_is_assigned()
      ';
    end if;
  end if;
end $$;
