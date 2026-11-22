import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
export const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

const isPlaceholderValue = (value: string) =>
  !value ||
  value.includes('placeholder') ||
  value.startsWith('your_') ||
  value.includes('your_supabase');

export const isSupabaseConfigured =
  !isPlaceholderValue(supabaseUrl) &&
  !isPlaceholderValue(supabaseAnonKey) &&
  /^https?:\/\/.+/.test(supabaseUrl);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
