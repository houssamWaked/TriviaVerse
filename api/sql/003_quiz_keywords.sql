-- Custom quiz keywords + improved search ranking.
--
-- Run this against your Supabase Postgres database.
--
-- Adds:
-- - `quizzes.keywords` (text): user-provided keywords/tags for search (comma/space separated).
-- - Optional trigram index for faster ILIKE searches.
-- - RPC `custom_quiz_play_counts(quiz_ids uuid[])` to return play counts from `quiz_scores`.

alter table public.quizzes
  add column if not exists keywords text null;

-- Optional performance: trigram indexes for faster keyword/title/description search.
do $$
begin
  begin
    create extension if not exists pg_trgm;
  exception
    when insufficient_privilege then
      -- Extension creation can be restricted in some environments; continue without it.
      null;
  end;

  if exists (select 1 from pg_extension where extname = 'pg_trgm') then
    create index if not exists quizzes_title_trgm_idx
      on public.quizzes using gin (title gin_trgm_ops);
    create index if not exists quizzes_description_trgm_idx
      on public.quizzes using gin (description gin_trgm_ops);
    create index if not exists quizzes_keywords_trgm_idx
      on public.quizzes using gin (keywords gin_trgm_ops);
  end if;
end $$;

-- Return number of (unique) players per quiz (based on `quiz_scores` rows).
-- Used to sort search results by "most played" first.
create or replace function public.custom_quiz_play_counts(quiz_ids uuid[])
returns table (quiz_id uuid, played_count bigint)
language sql
stable
as $$
  select qs.quiz_id, count(*)::bigint as played_count
  from public.quiz_scores qs
  where qs.quiz_id = any(quiz_ids)
  group by qs.quiz_id
$$;

