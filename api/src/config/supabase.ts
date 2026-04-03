/**
 * Supabase admin client factory.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import './env.js';

const isTest =
  process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test';
const supabaseUrl =
  process.env.SUPABASE_URL || (isTest ? 'https://example.supabase.co' : undefined);
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || (isTest ? 'test-service-role-key' : undefined);
const anonKey = process.env.SUPABASE_ANON_KEY || (isTest ? 'test-anon-key' : undefined);

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
}

export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const supabase = supabaseAdmin;

export const supabasePublic: SupabaseClient | null = anonKey
  ? createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  : null;
