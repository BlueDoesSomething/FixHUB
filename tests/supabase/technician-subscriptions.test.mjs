import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const customer = '11111111-1111-4111-8111-111111111111';
const technician = '22222222-2222-4222-8222-222222222222';
const repair = '33333333-3333-4333-8333-333333333333';

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
    grant usage on schema auth to authenticated, service_role;
    grant execute on function auth.uid() to authenticated, service_role;
  `);
  for (const file of [
    '20261101000000_auth_profiles.sql',
    '20261102000000_business_data.sql',
    '20261114000000_technician_subscriptions.sql',
  ]) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  }
  await db.query('insert into auth.users (id) values ($1), ($2)', [customer, technician]);
  const application = (await db.query(`insert into public.technician_applications
    (applicant_id, full_name, email, contact_number, city, years_experience, brands,
     specializations, experience_description, service_type, coverage_area, working_days, working_hours, status)
    values ($1, 'Test Technician', 'private@example.test', '09171234567', 'Makati', 3, array['Apple'],
     array['Smartphone'], 'Experienced in smartphone repairs.', 'both', 'Makati', array['Mon'], '9am–5pm', 'approved') returning id`, [technician])).rows[0].id;
  await db.query('insert into public.technician_profiles (user_id, application_id) values ($1, $2)', [technician, application]);
  await db.query("update public.user_roles set role = 'technician' where user_id = $1", [technician]);
});
after(async () => { await db.close(); });

async function asTechnician() {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [technician]);
}

async function newRepair() {
  await db.exec('reset role');
  await db.query(`insert into public.repair_requests (id, customer_id, device, brand, model, problem, service_type, location)
    values ($1, $2, 'Phone', 'Apple', 'iPhone', 'Broken screen', 'home', 'Makati City')`, [repair, customer]);
}

test('rollout starts off, permits existing acceptance, and hides other users subscription state', async () => {
  await db.exec('begin');
  try {
    await newRepair();
    await db.query("insert into public.technician_subscriptions (user_id, status) values ($1, 'active')", [customer]);
    await asTechnician();
    const status = (await db.query('select * from public.my_technician_subscription()')).rows[0];
    assert.equal(status.status, 'none');
    assert.equal(status.enforced, false);
    assert.deepEqual((await db.query('select user_id from public.technician_subscriptions')).rows, []);
    await db.exec('savepoint denied_update');
    await assert.rejects(db.query('update public.technician_subscriptions set status = $1', ['active']), /permission denied/);
    await db.exec('rollback to savepoint denied_update; release savepoint denied_update');
    await db.query('select public.accept_repair_request($1)', [repair]);
    assert.equal((await db.query('select status from public.repair_requests where id = $1', [repair])).rows[0].status, 'accepted');
  } finally { await db.exec('rollback; reset role'); }
});

test('billing enforcement gates only new acceptance; active status unlocks it', async () => {
  await db.exec('begin');
  try {
    await newRepair();
    await db.exec('update fixhub_private.technician_billing_settings set enforced = true');
    await asTechnician();
    await db.exec('savepoint denied_accept');
    await assert.rejects(db.query('select public.accept_repair_request($1)', [repair]), /active technician subscription is required/);
    await db.exec('rollback to savepoint denied_accept; release savepoint denied_accept');
    await db.exec('rollback');
    await db.exec('begin');
    await newRepair();
    await db.exec('reset role');
    await db.exec('update fixhub_private.technician_billing_settings set enforced = true');
    await db.query("insert into public.technician_subscriptions (user_id, status) values ($1, 'active')", [technician]);
    await asTechnician();
    await db.query('select public.accept_repair_request($1)', [repair]);
    assert.equal((await db.query('select status from public.repair_requests where id = $1', [repair])).rows[0].status, 'accepted');
  } finally { await db.exec('rollback; reset role'); }
});

test('only service role can claim a start; a concurrent start cannot acquire the same lease', async () => {
  await db.exec('begin');
  try {
    await asTechnician();
    await db.exec('savepoint denied_claim');
    await assert.rejects(db.query('select public.claim_technician_subscription_start($1)', [technician]), /permission denied/);
    await db.exec('rollback to savepoint denied_claim; release savepoint denied_claim');
    await db.exec('reset role');
    const first = (await db.query('select public.claim_technician_subscription_start($1) as id', [technician])).rows[0].id;
    assert.ok(first);
    const second = (await db.query('select public.claim_technician_subscription_start($1) as id', [technician])).rows[0].id;
    assert.equal(second, null);
  } finally { await db.exec('rollback; reset role'); }
});
