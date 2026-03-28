import { createClient } from '@supabase/supabase-js';

// Vercel Supabase integration creates env vars with custom prefix
// In vite.config.ts, loadEnv(mode, '.', '') loads ALL env vars
const env = (import.meta as any).env || {};

const supabaseUrl =
  env.VITE_SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  env.VITE_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY_SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL or Anon Key not found. Auth will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
