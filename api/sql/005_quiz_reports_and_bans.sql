-- Quiz reporting + user bans (moderation).
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

  -- ===== users: bans =====
  if to_regclass('public.users') is not null then
    alter table public.users
      add column if not exists is_banned boolean not null default false;

    alter table public.users
      add column if not exists banned_reason text null;

    alter table public.users
      add column if not exists banned_at timestamptz null;

    alter table public.users
      add column if not exists banned_by_admin_email text null;
  end if;

  -- ===== quiz_reports =====
  if to_regclass('public.quiz_reports') is null then
    create table public.quiz_reports (
      id uuid primary key default gen_random_uuid(),
      quiz_id uuid not null,
      reporter_user_id uuid not null,
      reason text not null default 'other',
      message text null,
      status text not null default 'open',
      resolved_at timestamptz null,
      resolved_by_admin_email text null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      constraint quiz_reports_status_check check (status in ('open', 'resolved')),
      constraint quiz_reports_quiz_fk foreign key (quiz_id) references public.quizzes(id) on delete cascade,
      constraint quiz_reports_reporter_fk foreign key (reporter_user_id) references public.users(id) on delete cascade
    );
  else
    alter table public.quiz_reports
      add column if not exists quiz_id uuid;
    alter table public.quiz_reports
      add column if not exists reporter_user_id uuid;
    alter table public.quiz_reports
      add column if not exists reason text;
    alter table public.quiz_reports
      add column if not exists message text;
    alter table public.quiz_reports
      add column if not exists status text;
    alter table public.quiz_reports
      add column if not exists resolved_at timestamptz;
    alter table public.quiz_reports
      add column if not exists resolved_by_admin_email text;
    alter table public.quiz_reports
      add column if not exists created_at timestamptz not null default now();
    alter table public.quiz_reports
      add column if not exists updated_at timestamptz not null default now();

    if not exists (select 1 from pg_constraint where conname = 'quiz_reports_status_check') then
      alter table public.quiz_reports
        add constraint quiz_reports_status_check check (status in ('open', 'resolved'));
    end if;
  end if;

  -- Prevent spam: only one report per reporter per quiz.
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'quiz_reports'
      and c.contype in ('p', 'u')
      and (
        select array_agg(att.attname::text order by att.attname::text)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute att on att.attrelid = t.oid and att.attnum = k.attnum
      ) = array['quiz_id', 'reporter_user_id']
  ) then
    alter table public.quiz_reports
      add constraint quiz_reports_quiz_reporter_unique unique (quiz_id, reporter_user_id);
  end if;

  create index if not exists quiz_reports_status_created_idx
    on public.quiz_reports (status, created_at desc);
  create index if not exists quiz_reports_quiz_idx
    on public.quiz_reports (quiz_id, created_at desc);
end $$;

