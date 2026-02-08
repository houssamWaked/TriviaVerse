-- Email verification support for custom `users` table.
--
-- Run this against your Supabase Postgres database.

alter table public.users
  add column if not exists email_verified_at timestamptz null;

-- Mark existing users as verified so they can keep logging in.
-- Remove this line if you want to force legacy users to verify.
update public.users
set email_verified_at = coalesce(email_verified_at, now());

