-- Admin dashboard schema helpers (PostgreSQL / Supabase)
--
-- Run these in your SQL editor (e.g. Supabase SQL Editor).
-- Safe to run multiple times (uses IF NOT EXISTS where possible).

-- 1) Allow a global question bank (quiz_id NULL)
-- If you already have this nullable, this will be a no-op.
alter table if exists public.quiz_questions
  alter column quiz_id drop not null;

-- 2) Mode question pools (classic/blitz/millionaire)
create table if not exists public.mode_question_pool (
  mode text not null,
  quiz_question_id uuid not null references public.quiz_questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint mode_question_pool_mode_check
    check (mode in ('classic', 'blitz', 'millionaire')),
  constraint mode_question_pool_unique unique (mode, quiz_question_id)
);

create index if not exists mode_question_pool_mode_idx
  on public.mode_question_pool(mode);

-- 3) Story level pool should prevent duplicates (recommended)
-- If you created story_level_pool without a unique constraint, add it.
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'story_level_pool'
  ) then
    begin
      alter table public.story_level_pool
        add constraint story_level_pool_unique unique (level_id, quiz_question_id);
    exception when duplicate_object then
      -- already exists
      null;
    end;
  end if;
end $$;

