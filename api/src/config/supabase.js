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
 */
import { createClient } from '@supabase/supabase-js';
import './env.js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Back-compat alias
export const supabase = supabaseAdmin;
