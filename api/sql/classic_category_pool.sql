-- Classic category -> question pool mapping
--
-- This enables classic mode to pick questions by category without changing `quiz_questions`.
--
-- Expected usage:
-- - Admin assigns global questions (quiz_questions.quiz_id is null) to a category.
-- - Classic session start selects from this pool when `category_id` is provided.

create extension if not exists pgcrypto;

create table if not exists public.classic_category_pool (
  category_id uuid not null references public.categories(id) on delete cascade,
  quiz_question_id uuid not null references public.quiz_questions(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint classic_category_pool_pkey primary key (category_id, quiz_question_id)
);

create index if not exists idx_classic_category_pool_category
  on public.classic_category_pool (category_id);

