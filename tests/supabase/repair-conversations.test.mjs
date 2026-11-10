import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const customer = '11111111-1111-4111-8111-111111111111';
const technician = '22222222-2222-4222-8222-222222222222';
const stranger = '44444444-4444-4444-8444-444444444444';
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
    '20261101000000_auth_profiles.sql', '20261102000000_business_data.sql',
    '20261113000000_technician_open_repair_queue.sql',
    '20261114000000_technician_subscriptions.sql',
    '20261115000000_repair_conversations.sql',
  ]) await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8'));
  await db.query('insert into auth.users (id) values ($1), ($2), ($3)', [customer, technician, stranger]);
  await db.query('update public.profiles set full_name = $1 where user_id = $2', ['Alex Customer', customer]);
  await db.query('update public.profiles set full_name = $1 where user_id = $2', ['Pat Account', technician]);
  const application = (await db.query(`insert into public.technician_applications
    (applicant_id, full_name, email, contact_number, city, years_experience, brands,
      specializations, experience_description, service_type, coverage_area, working_days, working_hours, status)
    values ($1, 'Pat Technician', 'private@example.test', '09171234567', 'Makati', 3, array['Apple'],
      array['Smartphone'], 'Experienced in smartphone repairs.', 'both', 'Makati', array['Mon'], '9am–5pm', 'approved') returning id`, [technician])).rows[0].id;
  await db.query('insert into public.technician_profiles (user_id, application_id) values ($1, $2)', [technician, application]);
  await db.query("update public.user_roles set role = 'technician' where user_id = $1", [technician]);
});
after(async () => { await db.close(); });

async function as(userId) {
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId]);
}

test('queue shows customer account name; acceptance immediately creates a private two-person conversation', async () => {
  await db.exec('begin');
  try {
    await db.query(`insert into public.repair_requests (id, customer_id, device, brand, model, problem, service_type, location)
      values ($1, $2, 'Phone', 'Apple', 'iPhone', 'Broken screen', 'home', 'Makati City')`, [repair, customer]);
    await as(technician);
    const pending = (await db.query('select * from public.list_available_repairs()')).rows;
    assert.equal(pending[0].customer_name, 'Alex Customer');
    assert.deepEqual((await db.query('select * from public.list_my_repair_conversations()')).rows, []);
    await db.exec('savepoint early_message');
    await assert.rejects(db.query('insert into public.repair_messages (repair_id, body) values ($1, $2)', [repair, 'Before acceptance']), /row-level security/);
    await db.exec('rollback to savepoint early_message; release savepoint early_message');
    await db.query('select public.accept_repair_request($1)', [repair]);
    const techThreads = (await db.query('select * from public.list_my_repair_conversations()')).rows;
    assert.equal(techThreads[0].customer_name, 'Alex Customer');
    assert.equal(techThreads[0].technician_name, 'Pat Account');
    assert.equal(techThreads[0].repair_id, repair);
    await db.query('insert into public.repair_messages (repair_id, body) values ($1, $2)', [repair, 'I can help with your phone.']);
    await as(customer);
    assert.equal((await db.query('select * from public.list_my_repair_conversations()')).rows[0].technician_name, 'Pat Account');
    assert.equal((await db.query('select body from public.repair_messages')).rows[0].body, 'I can help with your phone.');
    await db.query('insert into public.repair_messages (repair_id, body) values ($1, $2)', [repair, 'Thank you!']);
    await as(stranger);
    assert.deepEqual((await db.query('select * from public.list_my_repair_conversations()')).rows, []);
    assert.deepEqual((await db.query('select * from public.repair_messages')).rows, []);
    await db.exec('savepoint stranger_message');
    await assert.rejects(db.query('insert into public.repair_messages (repair_id, body) values ($1, $2)', [repair, 'Private?']), /row-level security/);
    await db.exec('rollback to savepoint stranger_message; release savepoint stranger_message');
    await as(technician);
    assert.equal((await db.query('select count(*)::int as count from public.repair_messages')).rows[0].count, 2);
    await db.exec('savepoint forged_sender');
    await assert.rejects(db.query('insert into public.repair_messages (repair_id, sender_id, body) values ($1, $2, $3)', [repair, customer, 'Forged']), /permission denied/);
    await db.exec('rollback to savepoint forged_sender; release savepoint forged_sender');
    await db.exec('reset role');
    await db.query("update public.repair_requests set status = 'cancelled' where id = $1", [repair]);
    await as(customer);
    assert.equal((await db.query('select count(*)::int as count from public.repair_messages')).rows[0].count, 2);
    await db.exec('savepoint cancelled_message');
    await assert.rejects(db.query('insert into public.repair_messages (repair_id, body) values ($1, $2)', [repair, 'After cancellation']), /row-level security/);
    await db.exec('rollback to savepoint cancelled_message; release savepoint cancelled_message');
  } finally { await db.exec('rollback; reset role'); }
});
