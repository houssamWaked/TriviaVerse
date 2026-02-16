-- Classic category levels (Classic becomes "story-like" per category)
--
-- Adds:
-- - classic_category_levels: levels per category (e.g. Math Level 1..5)
-- - classic_category_level_pool: assign global questions to a specific level
-- - classic_sessions: maps a classic game_session to (category, level)
-- - user_classic_progress: per-user progress per classic level (unlock + stars)
--
-- Notes:
-- - This is safe to run multiple times (idempotent).
-- - If `quiz_questions.is_assigned` exists, triggers keep it in sync for this pool table too.
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
end $$;

do $$
begin
  if to_regclass('public.categories') is null then
    raise exception 'public.categories is required';
  end if;
  if to_regclass('public.quiz_questions') is null then
    raise exception 'public.quiz_questions is required';
  end if;
  if to_regclass('public.game_sessions') is null then
    raise exception 'public.game_sessions is required';
  end if;
  if to_regclass('public.users') is null then
    raise exception 'public.users is required';
  end if;
end $$;

-- Levels per category
create table if not exists public.classic_category_levels (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null,
  level_number integer not null,
  title text not null default '',
  difficulty_min integer not null default 1,
  difficulty_max integer not null default 10,
  xp_reward integer not null default 0,
  created_at timestamptz not null default now(),
  constraint classic_category_levels_category_fk
    foreign key (category_id) references public.categories(id) on delete cascade,
  constraint classic_category_levels_unique unique (category_id, level_number),
  constraint classic_category_levels_difficulty_check
    check (
      difficulty_min >= 1 and difficulty_min <= 10 and
      difficulty_max >= 1 and difficulty_max <= 10 and
      difficulty_max >= difficulty_min
    )
);

create index if not exists classic_category_levels_category_level_idx
  on public.classic_category_levels (category_id, level_number asc);

-- Pool per level
create table if not exists public.classic_category_level_pool (
  level_id uuid not null,
  quiz_question_id uuid not null,
  created_at timestamptz not null default now(),
  constraint classic_category_level_pool_level_fk
    foreign key (level_id) references public.classic_category_levels(id) on delete cascade,
  constraint classic_category_level_pool_question_fk
    foreign key (quiz_question_id) references public.quiz_questions(id) on delete cascade,
  constraint classic_category_level_pool_unique unique (level_id, quiz_question_id)
);

create index if not exists classic_category_level_pool_level_created_idx
  on public.classic_category_level_pool (level_id, created_at desc);

create index if not exists classic_category_level_pool_question_idx
  on public.classic_category_level_pool (quiz_question_id);

-- Map classic session -> (category, level)
create table if not exists public.classic_sessions (
  session_id uuid primary key,
  category_id uuid not null,
  level_id uuid not null,
  level_number integer not null,
  created_at timestamptz not null default now(),
  constraint classic_sessions_session_fk
    foreign key (session_id) references public.game_sessions(id) on delete cascade,
  constraint classic_sessions_category_fk
    foreign key (category_id) references public.categories(id) on delete cascade,
  constraint classic_sessions_level_fk
    foreign key (level_id) references public.classic_category_levels(id) on delete cascade
);

create index if not exists classic_sessions_category_created_idx
  on public.classic_sessions (category_id, created_at desc);

-- Per-user progress per classic level
create table if not exists public.user_classic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  level_id uuid not null,
  best_score integer not null default 0,
  stars_earned integer not null default 0,
  attempts_count integer not null default 0,
  is_unlocked boolean not null default false,
  is_completed boolean not null default false,
  last_played_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint user_classic_progress_user_fk
    foreign key (user_id) references public.users(id) on delete cascade,
  constraint user_classic_progress_level_fk
    foreign key (level_id) references public.classic_category_levels(id) on delete cascade,
  constraint user_classic_progress_unique unique (user_id, level_id),
  constraint user_classic_progress_stars_check check (stars_earned >= 0 and stars_earned <= 3)
);

create index if not exists user_classic_progress_user_last_idx
  on public.user_classic_progress (user_id, last_played_at desc nulls last);

-- Keep quiz_questions.is_assigned in sync for this pool table too (if configured).
do $$
begin
  if to_regclass('public.quiz_questions') is null then
    return;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quiz_questions'
      and column_name = 'is_assigned'
  ) then
    return;
  end if;

  create or replace function public.tv_classic_level_pool_refresh_assigned()
  returns trigger
  language plpgsql
  as $fn$
  declare
    qid uuid;
    has_refresh boolean;
  begin
    if tg_op = 'DELETE' then
      qid := old.quiz_question_id;
    else
      qid := new.quiz_question_id;
    end if;

    has_refresh := to_regprocedure('public.tv_refresh_question_is_assigned(uuid)') is not null;
    if has_refresh then
      perform public.tv_refresh_question_is_assigned(qid);
    else
      -- Minimal back-compat: set true on insert/update; recompute on delete.
      if tg_op <> 'DELETE' then
        update public.quiz_questions set is_assigned = true where id = qid;
      else
        update public.quiz_questions q
        set is_assigned = (
          exists (select 1 from public.story_level_pool p where p.quiz_question_id = q.id) or
          exists (select 1 from public.classic_category_pool p where p.quiz_question_id = q.id) or
          exists (select 1 from public.classic_category_level_pool p where p.quiz_question_id = q.id) or
          exists (select 1 from public.mode_question_pool p where p.quiz_question_id = q.id)
        )
        where q.id = qid;
      end if;
    end if;

    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end;
  $fn$;

  if not exists (select 1 from pg_trigger where tgname = 'tv_classic_level_pool_refresh_assigned_trg') then
    execute '
      create trigger tv_classic_level_pool_refresh_assigned_trg
      after insert or update or delete on public.classic_category_level_pool
      for each row
      execute function public.tv_classic_level_pool_refresh_assigned()
    ';
  end if;
end $$;

