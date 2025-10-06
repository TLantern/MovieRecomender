import { createClient } from '@supabase/supabase-js';

// Support both public and server env var names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Only create browser/client instance if anon key is present
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Server-side client with service role key. Be tolerant and return null when misconfigured.
export const createServerSupabaseClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; subscription features disabled.');
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Helper function to check if supabase is available
export const isSupabaseAvailable = () => {
  return Boolean(supabase);
};