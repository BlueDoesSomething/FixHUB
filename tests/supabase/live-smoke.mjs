import { createClient } from '@supabase/supabase-js';

// This is an explicitly opted-in, write-producing test of a development project.
// Never embed account passwords or private API credentials in this file.
if (process.env.SUPABASE_SMOKE_ALLOW_WRITES !== 'yes') {
  throw new Error('This smoke test writes applications, repairs, and reviews and changes a test account role. Use a development project and set SUPABASE_SMOKE_ALLOW_WRITES=yes to opt in.');
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in your local environment before running the hosted smoke test.`);
  return value;
}

const URL = required('SUPABASE_URL');
const KEY = required('SUPABASE_PUBLISHABLE_KEY');
const CLIENT = required('SUPABASE_SMOKE_CLIENT_EMAIL');
const ADMIN = required('SUPABASE_SMOKE_ADMIN_EMAIL');
const clientPassword = required('SUPABASE_SMOKE_CLIENT_PASSWORD');
const adminPassword = required('SUPABASE_SMOKE_ADMIN_PASSWORD');
const mk = () => createClient(URL, KEY);
const client = mk();
const admin = mk();

const clientLogin = await client.auth.signInWithPassword({ email: CLIENT, password: clientPassword });
if (clientLogin.error) throw new Error('Client test account sign-in failed. Check its local environment credentials.');
const adminLogin = await admin.auth.signInWithPassword({ email: ADMIN, password: adminPassword });
if (adminLogin.error) throw new Error('Administrator test account sign-in failed. Check its local environment credentials.');

// 1. Client submits a technician application
const { data: appId, error: appErr } = await client.rpc('submit_my_application', {
  p_full_name: 'Test Client',
  p_contact_number: '+63 917 555 2211',
  p_city: 'Quezon City',
  p_years_experience: 6,
  p_brands: ['Samsung', 'Xiaomi'],
  p_specializations: ['Screen Replacement', 'Battery Replacement'],
  p_experience_description: 'Six years running a small repair shop in Cubao handling mostly Samsung and Xiaomi screen and battery jobs.',
  p_service_type: 'both',
  p_coverage_area: 'Quezon City, San Juan',
  p_working_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  p_working_hours: '9:00 AM - 7:00 PM',
});
console.log('1. submit_my_application:', appErr ? 'ERR ' + appErr.message : 'OK id=' + appId);

// 2. Client creates a repair request
const { data: repairId, error: repErr } = await client.rpc('create_my_repair_request', {
  p_device: 'Smartphone',
  p_brand: 'Samsung',
  p_model: 'S23',
  p_problem: 'Screen is cracked after a fall and touch is unresponsive.',
  p_service_type: 'home',
  p_location: 'Quezon City, Philippines',
  p_latitude: 14.6765,
  p_longitude: 121.0477,
});
console.log('2. create_my_repair_request:', repErr ? 'ERR ' + repErr.message : 'OK id=' + repairId);

// 3. Admin reads the application
const { data: apps, error: listErr } = await admin.from('technician_applications').select('id, full_name, status');
console.log('3. admin reads applications:', listErr ? 'ERR ' + listErr.message : JSON.stringify(apps));

// 4. Admin approves it
const { error: apprErr } = await admin.rpc('admin_approve_application', { p_application_id: appId });
console.log('4. admin_approve_application:', apprErr ? 'ERR ' + apprErr.message : 'OK');

// 5. Applicant is now a technician
const { data: acc } = await client.rpc('get_my_account');
console.log('5. applicant role now:', acc?.[0]?.role);

// 6. Technician accepts + advances the repair
const { error: accErr } = await client.rpc('accept_repair_request', { p_repair_id: repairId });
console.log('6. accept_repair_request:', accErr ? 'ERR ' + accErr.message : 'OK');

for (const s of ['en_route', 'arrived', 'in_progress', 'completed']) {
  const { error } = await client.rpc('advance_repair_status', { p_repair_id: repairId, p_new_status: s });
  console.log('   advance to ' + s + ':', error ? 'ERR ' + error.message : 'OK');
}

// 7. Customer leaves a review on the completed repair
const { data: profile } = await client.from('technician_profiles').select('id').eq('user_id', acc[0].user_id).single();
const { error: revErr } = await client.from('reviews').insert({
  repair_id: repairId,
  customer_id: acc[0].user_id,
  technician_id: profile.id,
  rating: 5,
  comment: 'Fast and professional service, screen replaced perfectly.',
}).select().single();
console.log('7. insert review:', revErr ? 'ERR ' + revErr.message : 'OK id=' + revErr?.id);

// 8. Technician replies to the review
const { data: review } = await client.from('reviews').select('id').eq('repair_id', repairId).single();
const { error: replyErr } = await client.from('review_replies').insert({
  review_id: review.id,
  technician_id: acc[0].user_id,
  comment: 'Thanks for choosing FIXHUB! Glad your screen is working perfectly again.',
}).select().single();
console.log('8. insert reply:', replyErr ? 'ERR ' + replyErr.message : 'OK');

// 9. Review summary RPC
const { data: summary, error: sumErr } = await client.rpc('technician_review_summary', { p_technician_profile_id: profile.id });
console.log('9. technician_review_summary:', sumErr ? 'ERR ' + sumErr.message : JSON.stringify(summary));

// 10. Final repair state + reference number
const { data: final } = await client.rpc('list_my_repair_requests');
console.log('10. customer repair list:', JSON.stringify(final?.map(r => ({ reference: r.reference, status: r.status }))));

// 11. RLS check: client cannot read another user's data
const { data: otherApps } = await client.from('technician_applications').select('id');
console.log('11. client sees own applications only:', JSON.stringify(otherApps?.length));
