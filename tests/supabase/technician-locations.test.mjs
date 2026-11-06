import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const customer = '11111111-1111-4111-8111-111111111111';
const technician = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
let profileId;

async function asUser(id) {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
}
async function rejected(sql, params, pattern) {
  await db.exec('savepoint expected_failure');
  await assert.rejects(db.query(sql, params), pattern);
  await db.exec('rollback to savepoint expected_failure; release savepoint expected_failure');
}

before(async () => {
  await db.exec(`
    create role anon nologin noinherit;
    create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  const directory = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(directory)).filter(file => file.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, directory), 'utf8'));
  }
});

beforeEach(async () => {
  await db.exec('begin; reset role');
  for (const id of [customer, technician, other]) await db.query('insert into auth.users (id, email) values ($1, $2)', [id, `${id}@example.test`]);
  const { rows } = await db.query(`insert into public.technician_applications
    (applicant_id, full_name, email, contact_number, city, years_experience, brands,
     specializations, experience_description, service_type, coverage_area, working_days, working_hours, status)
    values ($1, 'Test Technician', 'private@example.test', '09171234567', 'Makati', 3, array['Apple'],
      array['Smartphone'], 'Experienced in smartphone repairs.', 'both', 'Makati', array['Mon'], '9am–5pm', 'approved') returning id`, [technician]);
  profileId = (await db.query('insert into public.technician_profiles (user_id, application_id) values ($1, $2) returning id', [technician, rows[0].id])).rows[0].id;
  await db.query("update public.user_roles set role = 'technician' where user_id = $1", [technician]);
});
afterEach(async () => { await db.exec('rollback; reset role'); });
after(async () => { await db.close(); });

test('technicians save and reload their own location; customers receive only safe shared fields', async () => {
  await asUser(technician);
  assert.deepEqual((await db.query('select * from public.get_my_technician_location()')).rows, []);
  await db.query('select * from public.save_my_technician_location($1, $2, $3)', [14.55, 121.02, '  Shop, Makati  ']);
  const saved = (await db.query('select * from public.get_my_technician_location()')).rows[0];
  assert.equal(saved.technician_id, profileId);
  assert.equal(saved.address, 'Shop, Makati');
  assert.equal(saved.is_shared, true);
  await asUser(customer);
  assert.deepEqual((await db.query('select * from public.technician_locations')).rows, []);
  assert.deepEqual((await db.query('select * from public.get_my_technician_location()')).rows, []);
  const directory = (await db.query('select * from public.list_located_technicians()')).rows;
  assert.equal(directory.length, 1);
  assert.equal(directory[0].latitude, 14.55);
  assert.deepEqual(Object.keys(directory[0]).sort(), ['id', 'full_name', 'specializations', 'service_type', 'latitude', 'longitude', 'address', 'updated_at'].sort());
});

test('updates replace the saved pin, and stopping sharing removes it from the directory', async () => {
  await asUser(technician);
  await db.query("select * from public.save_my_technician_location(14, 121, 'First shop')");
  await db.query("select * from public.save_my_technician_location(15, 120, 'New shop')");
  assert.equal((await db.query('select * from public.get_my_technician_location()')).rows.length, 1);
  await db.query('select public.stop_sharing_my_technician_location()');
  assert.equal((await db.query('select * from public.get_my_technician_location()')).rows[0].is_shared, false);
  await asUser(customer);
  assert.deepEqual((await db.query('select * from public.list_located_technicians()')).rows, []);
});

test('customers cannot save locations, overwrite another technician, or stop their sharing', async () => {
  await asUser(technician);
  await db.query("select * from public.save_my_technician_location(14, 121, 'Shared shop')");
  await asUser(other);
  await rejected("select * from public.save_my_technician_location(0, 0, 'Forged shop')", [], /Technician access/);
  await rejected('update public.technician_locations set latitude = 0 where technician_id = $1', [profileId], /permission denied/);
  await rejected('delete from public.technician_locations where technician_id = $1', [profileId], /permission denied/);
  await db.query('select public.stop_sharing_my_technician_location()');
  assert.equal((await db.query('select * from public.list_located_technicians()')).rows.length, 1);
});

test('anonymous and identity-less requests do not receive shared locations', async () => {
  await asUser(technician);
  await db.query("select * from public.save_my_technician_location(14, 121, 'Shared shop')");
  await db.exec('set role anon');
  await rejected('select * from public.list_located_technicians()', [], /permission denied/);
  await rejected('select * from public.technician_locations', [], /permission denied/);
  await asUser('');
  assert.deepEqual((await db.query('select * from public.list_located_technicians()')).rows, []);
});

test('inactive or demoted technicians are excluded and cannot publish locations', async () => {
  await asUser(technician);
  await db.query("select * from public.save_my_technician_location(14, 121, 'Shared shop')");
  await db.exec('reset role');
  await db.query('update public.technician_profiles set is_active = false where id = $1', [profileId]);
  await asUser(technician);
  await rejected("select * from public.save_my_technician_location(15, 120, 'New shop')", [], /active technician/);
  assert.deepEqual((await db.query('select * from public.list_located_technicians()')).rows, []);
  await db.exec('reset role');
  await db.query('update public.technician_profiles set is_active = true where id = $1', [profileId]);
  await db.query("update public.user_roles set role = 'client' where user_id = $1", [technician]);
  await asUser(customer);
  assert.deepEqual((await db.query('select * from public.list_located_technicians()')).rows, []);
});

test('the database rejects invalid coordinates and empty or oversized address labels', async () => {
  await asUser(technician);
  for (const [lat, lng, address] of [[91, 0, 'Shop'], [0, -181, 'Shop'], [NaN, 0, 'Shop'], [null, 0, 'Shop'], [0, 0, '  '], [0, 0, 'x'.repeat(501)]]) {
    await rejected('select * from public.save_my_technician_location($1, $2, $3)', [lat, lng, address], /constraint/);
  }
});
