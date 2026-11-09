import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

function isPublicKey(key: string) {
  if (key.startsWith('sb_publishable_') && key.length > 'sb_publishable_'.length) return true;
  // Supabase CLI/local stacks and older projects may still use the legacy anon JWT.
  try {
    const parts = key.split('.');
    if (parts.length !== 3) return false;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const parsed = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return parsed !== null && typeof parsed === 'object' && parsed.role === 'anon';
  } catch { return false; }
}

export function readSupabaseConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) throw new Error('Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local. See docs/supabase-setup.md.');
  let parsed: URL;
  try { parsed = new URL(url); }
  catch { throw new Error('Use your Supabase project API URL, not a PostgreSQL connection string.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  const secure = parsed.protocol === 'https:';
  const localDevelopment = import.meta.env.DEV && local && parsed.protocol === 'http:';
  if ((!secure && !localDevelopment) || parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) {
    throw new Error('Use an HTTPS Supabase project API URL. Local HTTP is allowed only for development. Do not include database credentials.');
  }
  if (!isPublicKey(key)) throw new Error('Use only a Supabase publishable key (or legacy anon key). Never use a secret or service-role key in VITE_ variables.');
  return { url: parsed.origin, key };
}

type ClientCache = { client?: SupabaseClient<Database> };
const hotData = import.meta.hot?.data;
const cache: ClientCache = hotData?.fixhubSupabase ?? {};
if (hotData) hotData.fixhubSupabase = cache;

/** Share a single authenticated Supabase client across the application. */
export function getSupabaseBackend(): SupabaseClient<Database> {
  if (!cache.client) {
    const { url, key } = readSupabaseConfig();
    cache.client = createClient<Database>(url, key, {
      // The callback page owns code exchange on both web and Android. Automatic
      // URL detection would race it and consume the one-use PKCE code twice.
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
    });
  }
  return cache.client;
}
