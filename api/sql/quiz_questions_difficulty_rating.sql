-- Add difficulty rating (1-10) to global + quiz questions.
--
-- This is used by admin tooling and (optionally) story seeding.
-- Run in Supabase SQL editor.

alter table if exists public.quiz_questions
  add column if not exists difficulty_rating int not null default 5;

alter table if exists public.quiz_questions
  drop constraint if exists quiz_questions_difficulty_rating_check;

alter table if exists public.quiz_questions
  add constraint quiz_questions_difficulty_rating_check
  check (difficulty_rating >= 1 and difficulty_rating <= 10);

create index if not exists idx_quiz_questions_difficulty_rating
  on public.quiz_questions (difficulty_rating);

