-- Fix leaderboard unique constraint to allow per-mode + global rows per user.
--
-- Error this resolves:
--   duplicate key value violates unique constraint "uq_leaderboard_user_period"
--
-- Expected unique key:
--   (user_id, period, mode)

alter table if exists public.leaderboard_entries
  drop constraint if exists uq_leaderboard_user_period;

alter table if exists public.leaderboard_entries
  add constraint uq_leaderboard_user_period_mode unique (user_id, period, mode);

create index if not exists idx_leaderboard_entries_period_mode_score
  on public.leaderboard_entries (period, mode, score_value desc);

