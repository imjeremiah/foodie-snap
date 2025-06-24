/**
 * @file Supabase client configuration for FoodieSnap.
 * This file exports the configured Supabase client instance used throughout the app.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * The main Supabase client instance.
 * Used for authentication, database operations, and real-time subscriptions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable automatic token refresh in background
    autoRefreshToken: true,
    // Persist auth session in async storage
    persistSession: true,
    // Detect auth state changes automatically
    detectSessionInUrl: false,
  },
}); 