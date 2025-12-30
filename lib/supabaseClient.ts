import { createClient } from '@supabase/supabase-js';

// Helper to safely access environment variables in different environments
const getEnvVar = (key: string) => {
  try {
    // Check for Vite's import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    // Check for standard process.env
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
};

// Use fallbacks to prevent "supabaseUrl is required" error during initialization
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://gbuoyrjleshtoxobufgj.supabase.co';
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_kUm44h2s_Xqv-34HRDTj-A_9S-8Zskg';

// Ensure a valid string is passed even if everything fails
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseKey || 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Use localStorage with a specific key for easier debugging
    storageKey: 'okko-gym-auth',
  }
});

// Helper to clear auth state when tokens are corrupted
export const clearAuthState = () => {
  try {
    // Clear Supabase auth tokens
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('sb-') || key.startsWith('okko-gym-auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('Error clearing auth state:', e);
  }
};