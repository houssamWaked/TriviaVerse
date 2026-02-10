-- Custom quiz leaderboard support (`quiz_scores` table).
--
-- Run this against your Supabase Postgres database.

do $$
begin
  if to_regclass('public.quiz_scores') is null then
    create table public.quiz_scores (
      quiz_id uuid not null,
      user_id uuid not null,
      best_score integer not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint quiz_scores_quiz_user_unique unique (quiz_id, user_id)
    );
  else
    alter table public.quiz_scores
      add column if not exists best_score integer not null default 0;

    alter table public.quiz_scores
      add column if not exists created_at timestamptz not null default now();

    alter table public.quiz_scores
      add column if not exists updated_at timestamptz not null default now();

    if not exists (
      select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'quiz_scores'
        and c.contype in ('p', 'u')
        and (
          select array_agg(att.attname::text order by att.attname::text)
          from unnest(c.conkey) as k(attnum)
          join pg_attribute att on att.attrelid = t.oid and att.attnum = k.attnum
        ) = array['quiz_id', 'user_id']
    ) then
      alter table public.quiz_scores
        add constraint quiz_scores_quiz_user_unique unique (quiz_id, user_id);
    end if;
  end if;
end $$;

create index if not exists quiz_scores_quiz_score_idx
  on public.quiz_scores (quiz_id, best_score desc, updated_at desc);

create index if not exists quiz_scores_user_updated_idx
  on public.quiz_scores (user_id, updated_at desc);
