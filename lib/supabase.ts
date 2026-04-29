import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Keep it true for internal navigation
    storageKey: 'sahaysathi-auth-token',
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined, // USE SESSION STORAGE (Clears on tab close)
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
