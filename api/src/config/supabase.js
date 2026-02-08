/**
 * Supabase admin client factory.
 *
 * Uses Supabase "service role" credentials. This key must remain server-side.
 *
 * Exports:
 * - `supabaseAdmin`: preferred explicit name for privileged operations
 * - `supabase`: backwards-compatible alias
 *
 * Env:
 * - `SUPABASE_URL`
 * - `SUPABASE_SERVICE_ROLE_KEY`
 * - `SUPABASE_ANON_KEY` (optional; used for sending Auth emails via OTP/magic links)
 */
import { createClient } from '@supabase/supabase-js';
import './env.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Back-compat alias
export const supabase = supabaseAdmin;

// Optional public client for Supabase Auth flows that send emails.
export const supabasePublic = anonKey
  ? createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  : null;
