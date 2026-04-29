import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser, // Only persist on the client
    storageKey: 'sahaysathi-auth-token',
    storage: isBrowser ? window.sessionStorage : undefined,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser
  }
});
