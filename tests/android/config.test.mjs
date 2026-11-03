import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateAndroidEnvironment } from '../../scripts/validate-android-env.mjs';

const config = { VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };
const jwt = role => `header.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;

test('accepts a public project configuration and a legacy anon key', () => {
  assert.doesNotThrow(() => validateAndroidEnvironment(config));
  assert.doesNotThrow(() => validateAndroidEnvironment({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY: jwt('anon') }));
});

test('requires both repository variables instead of building an unusable login', () => {
  for (const name of Object.keys(config)) {
    assert.throws(() => validateAndroidEnvironment({ ...config, [name]: '' }), /GitHub Settings/);
  }
});

test('rejects database URLs, credentials, insecure origins, and API paths', () => {
  for (const url of ['not a URL', 'postgresql://user:password@db.example.com/postgres', 'http://localhost:54321', 'https://user:password@project.supabase.co', 'https://project.supabase.co/rest/v1', 'https://project.supabase.co?key=private', 'https://project.supabase.co#token']) {
    assert.throws(() => validateAndroidEnvironment({ ...config, VITE_SUPABASE_URL: url }), /HTTPS/);
  }
});

test('rejects admin credentials without printing the supplied value', () => {
  for (const key of ['sb_secret_private', jwt('service_role'), 'database-password', 'sb_publishable_', 'bad.jwt.value']) {
    assert.throws(() => validateAndroidEnvironment({ ...config, VITE_SUPABASE_PUBLISHABLE_KEY: key }), error => {
      assert.match(error.message, /Never bundle/);
      assert.ok(!error.message.includes(key));
      return true;
    });
  }
});

test('requires paired optional map-provider settings', () => {
  assert.throws(() => validateAndroidEnvironment({ ...config, VITE_MAP_TILE_URL: 'https://tiles.example.com/{z}/{x}/{y}.png' }), /both optional/);
  assert.throws(() => validateAndroidEnvironment({ ...config, VITE_MAP_TILE_ATTRIBUTION: 'Map attribution' }), /both optional/);
  assert.doesNotThrow(() => validateAndroidEnvironment({ ...config, VITE_MAP_TILE_URL: 'https://tiles.example.com/{z}/{x}/{y}.png', VITE_MAP_TILE_ATTRIBUTION: 'Map attribution' }));
});
