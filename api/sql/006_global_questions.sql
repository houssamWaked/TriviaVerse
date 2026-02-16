-- Global questions (SQL helpers)
--
-- Use these helpers to insert "global" questions (quiz_id is NULL) directly via SQL,
-- including their options and optional assignment to a single mode pool.
--
-- Notes
-- - This is safe to run multiple times (CREATE OR REPLACE).
-- - These helpers enforce:
--   - explanation is required (non-empty)
--   - exactly 1 correct option
--   - a question can only belong to ONE pool (story OR classic_category OR mode)
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

  -- Some deployments may not have this column yet.
  if to_regclass('public.quiz_questions') is not null then
    alter table public.quiz_questions
      add column if not exists difficulty_rating integer null;

    -- Optional: keep difficulty_rating sane when present.
    if not exists (select 1 from pg_constraint where conname = 'quiz_questions_difficulty_rating_check') then
      begin
        alter table public.quiz_questions
          add constraint quiz_questions_difficulty_rating_check
          check (difficulty_rating is null or (difficulty_rating >= 1 and difficulty_rating <= 10));
      exception
        when insufficient_privilege then null;
        when others then null;
      end;
    end if;
  end if;
end $$;

create or replace function public.tv_assert_question_unassigned(p_question_id uuid, p_target_mode text default null)
returns void
language plpgsql
as $$
declare
  m text := nullif(lower(trim(coalesce(p_target_mode, ''))), '');
begin
  if p_question_id is null then
    raise exception 'question_id is required';
  end if;

  -- story pool
  if to_regclass('public.story_level_pool') is not null then
    if exists (
      select 1 from public.story_level_pool
      where quiz_question_id = p_question_id
      limit 1
    ) then
      raise exception 'Question % is already assigned to story pool', p_question_id;
    end if;
  end if;

  -- classic category pool
  if to_regclass('public.classic_category_pool') is not null then
    if exists (
      select 1 from public.classic_category_pool
      where quiz_question_id = p_question_id
      limit 1
    ) then
      raise exception 'Question % is already assigned to a classic category pool', p_question_id;
    end if;
  end if;

  -- classic category level pool
  if to_regclass('public.classic_category_level_pool') is not null then
    if exists (
      select 1 from public.classic_category_level_pool
      where quiz_question_id = p_question_id
      limit 1
    ) then
      raise exception 'Question % is already assigned to a classic category level pool', p_question_id;
    end if;
  end if;

  -- mode pool (only allow the same mode if already assigned)
  if to_regclass('public.mode_question_pool') is not null then
    if exists (
      select 1 from public.mode_question_pool
      where quiz_question_id = p_question_id
        and (m is null or lower(mode) <> m)
      limit 1
    ) then
      raise exception 'Question % is already assigned to another mode pool', p_question_id;
    end if;
  end if;
end;
$$;

create or replace function public.tv_assign_global_question_to_mode(p_question_id uuid, p_mode text)
returns boolean
language plpgsql
as $$
declare
  m text := lower(trim(coalesce(p_mode, '')));
  q_quiz_id uuid;
begin
  if m not in ('classic', 'blitz', 'millionaire') then
    raise exception 'Invalid mode: % (expected classic|blitz|millionaire)', p_mode;
  end if;

  select quiz_id
    into q_quiz_id
  from public.quiz_questions
  where id = p_question_id
  limit 1;

  if not found then
    raise exception 'Question % not found', p_question_id;
  end if;

  if q_quiz_id is null then
    -- ok, global question
    null;
  else
    raise exception 'Only global questions (quiz_id is NULL) can be assigned to mode pools';
  end if;

  perform public.tv_assert_question_unassigned(p_question_id, m);

  if to_regclass('public.mode_question_pool') is null then
    raise exception 'mode_question_pool is not configured. Run api/sql/004_mode_question_pool.sql first.';
  end if;

  insert into public.mode_question_pool (mode, quiz_question_id, created_at)
  values (m, p_question_id, now())
  on conflict (mode, quiz_question_id) do nothing;

  return true;
end;
$$;

create or replace function public.tv_add_global_question(
  p_question_text text,
  p_explanation text,
  p_options text[],
  p_correct_index integer,
  p_difficulty_rating integer default 5,
  p_time_limit_sec integer default 30,
  p_points integer default 100,
  p_assign_mode text default null
)
returns uuid
language plpgsql
as $$
declare
  qid uuid;
  opts text[];
  correct_idx integer;
  rating integer;
  time_limit integer;
  points integer;
  m text := nullif(lower(trim(coalesce(p_assign_mode, ''))), '');
  has_difficulty boolean;
begin
  if nullif(trim(coalesce(p_question_text, '')), '') is null then
    raise exception 'question_text is required';
  end if;
  if nullif(trim(coalesce(p_explanation, '')), '') is null then
    raise exception 'explanation is required';
  end if;

  opts := p_options;
  if opts is null or array_length(opts, 1) is null or array_length(opts, 1) < 2 then
    raise exception 'Provide at least 2 options';
  end if;

  correct_idx := coalesce(p_correct_index, 0);
  if correct_idx < 1 or correct_idx > array_length(opts, 1) then
    raise exception 'correct_index must be 1..% (got %)', array_length(opts, 1), correct_idx;
  end if;

  rating := least(10, greatest(1, coalesce(p_difficulty_rating, 5)));
  time_limit := least(600, greatest(5, coalesce(p_time_limit_sec, 30)));
  points := least(10000, greatest(0, coalesce(p_points, 100)));

  has_difficulty := exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quiz_questions'
      and column_name = 'difficulty_rating'
  );

  if has_difficulty then
    insert into public.quiz_questions (
      quiz_id, question_text, explanation, time_limit_sec, points, order_index, difficulty_rating
    )
    values (null, trim(p_question_text), trim(p_explanation), time_limit, points, 1, rating)
    returning id into qid;
  else
    insert into public.quiz_questions (
      quiz_id, question_text, explanation, time_limit_sec, points, order_index
    )
    values (null, trim(p_question_text), trim(p_explanation), time_limit, points, 1)
    returning id into qid;
  end if;

  -- insert options (exactly one correct)
  insert into public.question_options (question_id, option_text, is_correct, order_index)
  select
    qid,
    trim(o.option_text),
    (o.ord = correct_idx),
    o.ord
  from unnest(opts) with ordinality as o(option_text, ord);

  -- Optional assignment to ONE mode.
  if m is not null then
    perform public.tv_assert_question_unassigned(qid, m);
    perform public.tv_assign_global_question_to_mode(qid, m);
  end if;

  return qid;
end;
$$;

-- Examples
--
-- 1) Create a global question and assign to blitz:
-- select public.tv_add_global_question(
--   'Which planet is known as the Red Planet?',
--   'Mars appears red because of iron oxide (rust) on its surface.',
--   array['Venus','Mars','Jupiter','Saturn'],
--   2,
--   4,
--   15,
--   100,
--   'blitz'
-- );
--
-- 2) Create a global question without assigning to any pool:
-- select public.tv_add_global_question(
--   'What is the capital of Japan?',
--   'Tokyo is the capital and the most populous city in Japan.',
--   array['Osaka','Tokyo','Kyoto','Nagoya'],
--   2
-- );
