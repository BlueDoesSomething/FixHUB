import { pathToFileURL } from 'node:url';

export function validateAndroidEnvironment(env) {
  const url = env.VITE_SUPABASE_URL?.trim();
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error('Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in GitHub Settings > Secrets and variables > Actions > Variables.');
  }

  let parsed;
  try { parsed = new URL(url); }
  catch { throw new Error('VITE_SUPABASE_URL must be your HTTPS Supabase project API URL.'); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || !['', '/'].includes(parsed.pathname)) {
    throw new Error('Use an HTTPS Supabase project API URL without credentials, a path, or a connection string.');
  }

  let publicKey = key.startsWith('sb_publishable_') && key.length > 'sb_publishable_'.length;
  if (!publicKey) {
    try {
      const parts = key.split('.');
      publicKey = parts.length === 3 && JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))?.role === 'anon';
    } catch { publicKey = false; }
  }
  if (!publicKey) {
    throw new Error('Use a Supabase publishable key or legacy anon key. Never bundle a secret/service-role key or database password in an APK.');
  }

  if (!!env.VITE_MAP_TILE_URL?.trim() !== !!env.VITE_MAP_TILE_ATTRIBUTION?.trim()) {
    throw new Error('Set both optional VITE_MAP_TILE_URL and VITE_MAP_TILE_ATTRIBUTION variables, or leave both unset.');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    validateAndroidEnvironment(process.env);
    console.log('Public Android build configuration is valid.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
