import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string) => {
  // 1. Try import.meta.env (Standard Vite)
  // We check if import.meta.env exists before accessing the key to prevent crashes
  try {
    const meta = import.meta as any;
    if (typeof meta !== 'undefined' && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {
    // Ignore access errors
  }

  // 2. Try process.env (Fallback injected by vite.config.ts define)
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore access errors
  }

  return '';
};

// Access environment variables safely
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Check if we have valid credentials
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseUrl.length > 0 && supabaseAnonKey && supabaseAnonKey.length > 0);

if (!isSupabaseConfigured) {
  console.warn("Supabase credentials missing! The app will run in Local Demo Mode using localStorage.");
  console.log("Debug - URL Found:", !!supabaseUrl);
  console.log("Debug - Key Found:", !!supabaseAnonKey);
}

// Helper for the Settings UI to display debug info
export const getSupabaseDebugInfo = () => {
  return {
    urlConfigured: !!(supabaseUrl && supabaseUrl.length > 0),
    keyConfigured: !!(supabaseAnonKey && supabaseAnonKey.length > 0),
    urlPreview: supabaseUrl ? `${supabaseUrl.substring(0, 12)}...` : 'Not Set',
    keyPreview: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 6)}...` : 'Not Set',
    usingLocalMode: !isSupabaseConfigured
  };
};

// Use a valid placeholder URL to prevent the 'supabaseUrl is required' error during initialization.
const url = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const key = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(url || '', key || '');