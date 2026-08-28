import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser-safe values only. The publishable key is designed to be shipped to
// clients; every real access rule is enforced by row-level security in
// Postgres, because this app is a static export with no server of its own.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const OWNER_EMAIL = (process.env.EXPO_PUBLIC_OWNER_EMAIL ?? 'jasong409@pm.me')
  .trim()
  .toLowerCase();

// The app must still run as a pure demo when no backend is configured, so a
// missing key disables sign-in rather than crashing the bundle.
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        // Required for the magic-link redirect to be consumed on web.
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

// Convenience for UI copy; NOT a security boundary. The database decides.
export function isOwnerEmail(email: string | null | undefined) {
  return typeof email === 'string' && email.trim().toLowerCase() === OWNER_EMAIL;
}

export const BUDGETS_TABLE = 'budget_forecast_budgets';
