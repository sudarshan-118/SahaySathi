import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'sahaysathi-auth-token',
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // CORRECT FIX: Provide a dummy lock function that executes immediately
    // This stops the 'Lock not released' error in Next.js Dev Mode
    lock: async (name: string, acquire: () => Promise<any>) => {
      return await acquire();
    }
  }
});
