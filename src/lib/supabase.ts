import { createClient } from '@supabase/supabase-js';

// Detectar si estamos en Node.js o en el browser
// import.meta.env is always available in Vite browser builds,
// so check for it first to avoid false positives from Vite's process polyfill.
const isNode =
  typeof import.meta === 'undefined' ||
  typeof import.meta.env === 'undefined' ||
  !import.meta.env.VITE_SUPABASE_URL;

const supabaseUrl = isNode
  ? (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || ''
  : import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey = isNode
  ? (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || ''
  : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

// Configuración para browser
const browserConfig = {
  auth: {
    flowType: 'pkce' as const,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
  },
  global: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
};

// Configuración para Node.js (scripts)
const nodeConfig = {
  global: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
};

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  isNode ? nodeConfig : browserConfig
);
