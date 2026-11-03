import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

// Embedded PostgreSQL tests of our actual migration. This minimal Auth schema is a
// test fixture, NOT a replacement for Supabase Auth, JWT verification, or PostgREST.
const db = new PGlite();
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const signup = '33333333-3333-4333-8333-333333333333';
const fallback = '44444444-4444-4444-8444-444444444444';
let migration;
let bootstrap;

async function asUser(id) {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}

async function forbidden(sql, params = []) {
  await assert.rejects(db.query(sql, params), error => error.code === '42501');
}

before(async () => {
  migration = await readFile(new URL('../../supabase/migrations/20261101000000_auth_profiles.sql', import.meta.url), 'utf8');
  bootstrap = await readFile(new URL('../../supabase/admin/bootstrap-admin.sql', import.meta.url), 'utf8');
  await db.exec(`
    create role anon nologin noinherit;
    create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text,
      email_confirmed_at timestamptz,
      raw_user_meta_data jsonb default '{}'::jsonb
    );
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  await db.query("insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1, 'alice@example.test', now(), $2), ($3, 'bob@example.test', now(), $4)",
    [alice, JSON.stringify({ full_name: 'Alice Test', role: 'admin' }), bob, JSON.stringify({ full_name: 'Bob Test' })]);
  await db.exec(migration);
});

beforeEach(async () => {
  await db.exec("reset role; select set_config('request.jwt.claim.sub', '', false)");
  await db.query("update public.user_roles set role = 'client' where user_id in ($1, $2)", [alice, bob]);
  await db.query("update public.profiles set full_name = 'Alice Test', phone = '', city = '' where user_id = $1", [alice]);
});
afterEach(async () => { await db.exec('rollback; reset role'); });
after(async () => { await db.close(); });

test('the migration enables RLS and safely backfills existing Auth users as customers', async () => {
  const tables = await db.query("select relname, relrowsecurity from pg_class where oid in ('public.profiles'::regclass, 'public.user_roles'::regclass)");
  assert.equal(tables.rows.length, 2);
  assert.ok(tables.rows.every(table => table.relrowsecurity));
  await asUser(alice);
  const account = await db.query('select * from public.get_my_account()');
  assert.equal(account.rows.length, 1);
  assert.equal(account.rows[0].full_name, 'Alice Test');
  assert.equal(account.rows[0].role, 'client');
});

test('new signup creates a profile and cannot self-assign admin through metadata or email', async () => {
  await db.query('insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)',
    [signup, 'admin@fixhub.com', JSON.stringify({ full_name: '  New Customer  ', role: 'admin' })]);
  await asUser(signup);
  const { rows } = await db.query('select * from public.get_my_account()');
  assert.equal(rows[0].full_name, 'New Customer');
  assert.equal(rows[0].role, 'client');
});

test('invalid signup display-name metadata receives a safe fallback instead of breaking signup', async () => {
  await db.query('insert into auth.users (id, raw_user_meta_data) values ($1, $2)', [fallback, JSON.stringify({ full_name: { invalid: true } })]);
  await asUser(fallback);
  const { rows } = await db.query('select * from public.get_my_account()');
  assert.equal(rows[0].full_name, 'New customer');
  assert.equal(rows[0].role, 'client');
});

test('anonymous requests cannot read profiles, roles, or the account RPC', async () => {
  await db.exec('set role anon');
  await forbidden('select * from public.profiles');
  await forbidden('select * from public.user_roles');
  await forbidden('select * from public.get_my_account()');
});

test('each authenticated account reads only its own profile, role, and account result', async () => {
  await asUser(alice);
  for (const source of ['public.profiles', 'public.user_roles', 'public.get_my_account()']) {
    const { rows } = await db.query(`select user_id from ${source}`);
    assert.deepEqual(rows, [{ user_id: alice }]);
  }
  assert.deepEqual((await db.query('select * from public.profiles where user_id = $1', [bob])).rows, []);
});

test('an authenticated request without a user identity reads no account rows', async () => {
  await asUser('');
  assert.deepEqual((await db.query('select * from public.get_my_account()')).rows, []);
  assert.deepEqual((await db.query('select * from public.profiles')).rows, []);
});

test('an owner can update only their allowed profile fields', async () => {
  await asUser(alice);
  const { rows } = await db.query("update public.profiles set full_name = 'Alice Updated', phone = '+63 917 123 4567', city = 'Makati' where user_id = $1 returning full_name, phone, city, updated_at >= created_at as valid_timestamp", [alice]);
  assert.deepEqual(rows, [{ full_name: 'Alice Updated', phone: '+63 917 123 4567', city: 'Makati', valid_timestamp: true }]);
});

test('updating another customer matches zero rows and leaves their profile intact', async () => {
  await asUser(alice);
  const result = await db.query("update public.profiles set full_name = 'Stolen' where user_id = $1 returning user_id", [bob]);
  assert.deepEqual(result.rows, []);
  await db.exec('reset role');
  assert.equal((await db.query('select full_name from public.profiles where user_id = $1', [bob])).rows[0].full_name, 'Bob Test');
});

test('customers cannot transfer account ownership or modify protected timestamps', async () => {
  await asUser(alice);
  await forbidden('update public.profiles set user_id = $1 where user_id = $2', [bob, alice]);
  await forbidden("update public.profiles set created_at = '2000-01-01' where user_id = $1", [alice]);
  await forbidden("update public.profiles set updated_at = '2000-01-01' where user_id = $1", [alice]);
});

test('browser users cannot insert, delete, or truncate profiles', async () => {
  await asUser(alice);
  await forbidden('insert into public.profiles (user_id, full_name) values ($1, $2)', [alice, 'Replacement']);
  await forbidden('delete from public.profiles where user_id = $1', [alice]);
  await forbidden('truncate public.profiles');
  assert.equal((await db.query('select full_name from public.profiles')).rows[0].full_name, 'Alice Test');
});

test('browser users cannot insert, promote, delete, or truncate roles', async () => {
  await asUser(alice);
  await forbidden("insert into public.user_roles (user_id, role) values ($1, 'admin')", [alice]);
  await forbidden("update public.user_roles set role = 'admin' where user_id = $1", [alice]);
  await forbidden('delete from public.user_roles where user_id = $1', [alice]);
  await forbidden('truncate public.user_roles');
  assert.equal((await db.query('select role from public.user_roles')).rows[0].role, 'client');
});

test('profile length and trimming constraints are enforced in PostgreSQL', async () => {
  await asUser(alice);
  for (const name of ['', 'A', ' x ', 'x'.repeat(121)]) {
    await assert.rejects(db.query('update public.profiles set full_name = $1 where user_id = $2', [name, alice]), error => error.code === '23514');
  }
  await assert.rejects(db.query('update public.profiles set phone = $1 where user_id = $2', ['1'.repeat(33), alice]), error => error.code === '23514');
  await assert.rejects(db.query('update public.profiles set city = $1 where user_id = $2', ['x'.repeat(121), alice]), error => error.code === '23514');
});

test('changing Auth metadata does not change the authoritative database role', async () => {
  await db.query('update auth.users set raw_user_meta_data = $1 where id = $2', [JSON.stringify({ role: 'admin' }), alice]);
  await asUser(alice);
  assert.equal((await db.query('select role from public.get_my_account()')).rows[0].role, 'client');
});

test('trusted promotion/demotion is read freshly, without depending on a role claim in a JWT', async () => {
  await db.query("update public.user_roles set role = 'admin' where user_id = $1", [alice]);
  await asUser(alice);
  assert.equal((await db.query('select role from public.get_my_account()')).rows[0].role, 'admin');
  await db.exec('reset role');
  await db.query("update public.user_roles set role = 'client' where user_id = $1", [alice]);
  await asUser(alice);
  assert.equal((await db.query('select role from public.get_my_account()')).rows[0].role, 'client');
});

test('private signup helpers are not callable by browser roles', async () => {
  await asUser(alice);
  await forbidden("select fixhub_private.initial_profile_name('{}'::jsonb)");
  await db.exec('reset role');
  const grants = await db.query(`select
    has_function_privilege('anon', 'fixhub_private.create_account_profile()', 'execute') as anon_execute,
    has_function_privilege('authenticated', 'fixhub_private.create_account_profile()', 'execute') as user_execute,
    has_table_privilege('authenticated', 'public.profiles', 'trigger') as user_trigger,
    has_table_privilege('anon', 'public.profiles', 'select') as anon_select`);
  assert.deepEqual(grants.rows[0], { anon_execute: false, user_execute: false, user_trigger: false, anon_select: false });
});

test('deleting a test Auth user cascades to their profile and role', async () => {
  const temporary = '55555555-5555-4555-8555-555555555555';
  await db.query('insert into auth.users (id) values ($1)', [temporary]);
  await db.query('delete from auth.users where id = $1', [temporary]);
  assert.deepEqual((await db.query('select * from public.profiles where user_id = $1', [temporary])).rows, []);
  assert.deepEqual((await db.query('select * from public.user_roles where user_id = $1', [temporary])).rows, []);
});

test('owner bootstrap grants only the selected confirmed account an administrator role', async () => {
  await db.exec(bootstrap.replace('REPLACE_WITH_AUTH_USER_UUID', bob));
  assert.equal((await db.query('select role from public.user_roles where user_id = $1', [bob])).rows[0].role, 'admin');
  assert.equal((await db.query('select role from public.user_roles where user_id = $1', [alice])).rows[0].role, 'client');
});

test('owner bootstrap refuses an unconfirmed Auth account', async () => {
  await assert.rejects(db.exec(bootstrap.replace('REPLACE_WITH_AUTH_USER_UUID', signup)), /email-confirmed/);
  await db.exec('rollback');
  assert.equal((await db.query('select role from public.user_roles where user_id = $1', [signup])).rows[0].role, 'client');
});

test('rerunning a migration with existing object names fails without replacing account data', async () => {
  await assert.rejects(db.exec(migration), error => error.code === '42710');
  await db.exec('rollback');
  assert.equal((await db.query('select full_name from public.profiles where user_id = $1', [alice])).rows[0].full_name, 'Alice Test');
});
