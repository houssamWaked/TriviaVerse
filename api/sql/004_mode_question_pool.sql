-- Mode question pools (`mode_question_pool` table).
--
-- When this table exists, Classic/Blitz/Millionaire sessions pull ONLY from their assigned pools.
--
-- Run this against your Supabase Postgres database.

do $$
begin
  if to_regclass('public.mode_question_pool') is null then
    create table public.mode_question_pool (
      mode text not null,
      quiz_question_id uuid not null,
      created_at timestamptz not null default now(),
      constraint mode_question_pool_mode_question_unique unique (mode, quiz_question_id)
    );
  else
    alter table public.mode_question_pool
      add column if not exists created_at timestamptz not null default now();

    -- Ensure uniqueness on (mode, quiz_question_id) regardless of constraint name.
    if not exists (
      select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'mode_question_pool'
        and c.contype in ('p', 'u')
        and (
          select array_agg(att.attname::text order by att.attname::text)
          from unnest(c.conkey) as k(attnum)
          join pg_attribute att on att.attrelid = t.oid and att.attnum = k.attnum
        ) = array['mode', 'quiz_question_id']
    ) then
      alter table public.mode_question_pool
        add constraint mode_question_pool_mode_question_unique unique (mode, quiz_question_id);
    end if;
  end if;

  create index if not exists mode_question_pool_mode_idx
    on public.mode_question_pool (mode, created_at desc);
end $$;

-- Example: assign a GLOBAL question to Blitz pool (replace the UUID).
-- Note: global questions are `quiz_questions` rows with `quiz_id is null`.
--
-- insert into public.mode_question_pool (mode, quiz_question_id, created_at)
-- values ('blitz', '00000000-0000-0000-0000-000000000000'::uuid, now())
-- on conflict (mode, quiz_question_id) do nothing;

