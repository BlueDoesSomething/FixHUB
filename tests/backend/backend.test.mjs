import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { deleteApp, initializeApp, setLogLevel } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import {
  connectDataConnectEmulator,
  executeMutation,
  executeQuery,
  getDataConnect,
  mutationRef,
  queryRef,
} from 'firebase/data-connect';
import { connectorConfig, getMyProfile } from '../../src/dataconnect-generated/esm/index.esm.js';

// Fixed demo project and loopback addresses: these tests never target cloud data.
const projectId = 'demo-fixhub';
const connector = connectorConfig;
const apps = [];
setLogLevel('silent');
let alice;
let bob;
let admin;
let anonymous;

function client(name) {
  const app = initializeApp({ projectId, apiKey: 'demo-api-key', appId: 'demo-app-id' }, name);
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const dc = getDataConnect(app, connector);
  connectDataConnectEmulator(dc, '127.0.0.1', 9399);
  return { auth, dc };
}

async function account(name, createProfile = true) {
  const result = client(name);
  const { user } = await createUserWithEmailAndPassword(
    result.auth,
    `${name}-${Date.now()}@example.test`,
    'Fixhub-local-test-123!',
  );
  result.uid = user.uid;
  result.email = user.email;
  if (createProfile) {
    await mutate(result, 'CreateMyProfile', { fullName: name, phone: '', city: 'Manila' });
  }
  return result;
}

async function mutate(user, operation, variables = {}) {
  const result = await executeMutation(mutationRef(user.dc, operation, variables));
  return result.data;
}

async function query(user, operation, variables = {}) {
  const result = await executeQuery(queryRef(user.dc, operation, variables), { fetchPolicy: 'SERVER_ONLY' });
  return result.data;
}

async function privileged(querySource, variables) {
  const response = await fetch(
    `http://127.0.0.1:9399/v1/projects/${projectId}/locations/asia-southeast1/services/fixhub:executeGraphql`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ query: querySource, variables }),
    },
  );
  const result = await response.json();
  assert.equal(response.ok, true, JSON.stringify(result));
  assert.equal(result.errors?.length ?? 0, 0, JSON.stringify(result));
  return result.data;
}

const application = {
  fullName: 'Alice Technician',
  contactNumber: '+63 917 000 0000',
  city: 'Manila',
  yearsExperience: 4,
  brands: ['Samsung'],
  specializations: ['Screen Replacement'],
  experienceDescription: 'I have repaired phones professionally for four years.',
  serviceType: 'BOTH',
  coverageArea: 'Metro Manila',
  workingDays: ['Mon', 'Tue'],
  workingHours: '9:00 AM - 6:00 PM',
};

const repair = {
  device: 'Smartphone',
  brand: 'Apple',
  model: 'iPhone 13',
  problem: 'Phone is not charging.',
  serviceType: 'HOME',
  location: '123 Mabini Street, Manila',
};

before(async () => {
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST, 'Run through npm run test:backend.');
  alice = await account('Alice');
  bob = await account('Bob');
  admin = await account('Administrator');
  anonymous = client('Anonymous');
  const bootstrap = await readFile(new URL('../../dataconnect/admin/bootstrap-admin.gql', import.meta.url), 'utf8');
  await privileged(bootstrap, { uid: admin.uid });
});

after(async () => {
  await Promise.all(apps.map(app => deleteApp(app)));
});

test('authentication is required to read profiles, applications, or repairs', async () => {
  for (const operation of ['GetMyProfile', 'GetMyApplication', 'ListMyRepairRequests', 'AdminListApplications']) {
    await assert.rejects(query(anonymous, operation));
  }
});

test('profiles use the authenticated UID and start as customers', async () => {
  const { data: result } = await getMyProfile(alice.dc, { fetchPolicy: 'SERVER_ONLY' });
  assert.equal(result.user.id, alice.uid);
  assert.equal(result.user.email, alice.email);
  assert.equal(result.user.role, 'CLIENT');
  await mutate(alice, 'UpdateMyProfile', { fullName: 'Alice Updated', phone: '+63 917 000 0000', city: 'Makati' });
  assert.equal((await query(alice, 'GetMyProfile')).user.city, 'Makati');
  assert.equal((await query(bob, 'GetMyProfile')).user.city, 'Manila');
});

test('customers cannot read the admin application list or promote themselves', async () => {
  await assert.rejects(query(alice, 'AdminListApplications'));
  await assert.rejects(mutate(alice, 'BootstrapAdmin', { uid: alice.uid }));
  assert.equal((await query(alice, 'GetMyProfile')).user.role, 'CLIENT');
});

test('accounts without a database profile do not bypass admin checks', async () => {
  const user = await account('NoProfile', false);
  assert.equal((await query(user, 'GetMyProfile')).user, null);
  await assert.rejects(query(user, 'AdminListApplications'));
  await assert.rejects(mutate(user, 'SubmitMyApplication', application));
});

test('invalid profile and repair inputs are rejected on the server', async () => {
  await assert.rejects(mutate(alice, 'UpdateMyProfile', { fullName: '', phone: '', city: '' }));
  await assert.rejects(mutate(alice, 'CreateMyRepairRequest', { ...repair, problem: '' }));
  await assert.rejects(mutate(alice, 'CreateMyRepairRequest', { ...repair, serviceType: 'BOTH' }));
});

test('repair requests are visible only to their customer and cannot be cancelled by others', async () => {
  const result = await mutate(alice, 'CreateMyRepairRequest', repair);
  const id = result.repairRequest_insert.id;
  assert.equal((await query(alice, 'ListMyRepairRequests')).repairRequests[0].id, id);
  assert.equal((await query(bob, 'ListMyRepairRequests')).repairRequests.length, 0);
  await assert.rejects(mutate(bob, 'CancelMyRepairRequest', { id }));
  assert.equal((await query(alice, 'ListMyRepairRequests')).repairRequests[0].status, 'PENDING');
  await mutate(alice, 'CancelMyRepairRequest', { id });
  assert.equal((await query(alice, 'ListMyRepairRequests')).repairRequests[0].status, 'CANCELLED');
  await assert.rejects(mutate(alice, 'CancelMyRepairRequest', { id }));
});

test('application input validation runs on the server', async () => {
  await assert.rejects(mutate(alice, 'SubmitMyApplication', { ...application, yearsExperience: -1 }));
  await assert.rejects(mutate(alice, 'SubmitMyApplication', { ...application, brands: [] }));
  await assert.rejects(mutate(alice, 'SubmitMyApplication', { ...application, workingDays: ['Invalid'] }));
  assert.equal((await query(alice, 'GetMyApplication')).technicianApplications.length, 0);
});

test('approval is admin-only, atomic, and records an audit event', async () => {
  const result = await mutate(alice, 'SubmitMyApplication', application);
  const id = result.technicianApplication_insert.id;
  assert.equal((await query(bob, 'GetMyApplication')).technicianApplications.length, 0);
  await assert.rejects(mutate(alice, 'SubmitMyApplication', application));
  await assert.rejects(mutate(bob, 'AdminApproveApplication', { id }));
  assert.equal((await query(alice, 'GetMyApplication')).technicianApplications[0].status, 'PENDING');

  await mutate(admin, 'AdminStartApplicationReview', { id });
  await mutate(admin, 'AdminApproveApplication', { id });
  const approved = (await query(alice, 'GetMyApplication')).technicianApplications[0];
  assert.equal(approved.status, 'APPROVED');
  assert.equal(approved.applicantId, alice.uid);
  assert.equal(approved.email, alice.email);
  assert.deepEqual(approved.applicationEvents_on_application.map(event => event.status), [
    'PENDING', 'UNDER_REVIEW', 'APPROVED',
  ]);
  assert.equal((await query(alice, 'GetMyProfile')).user.role, 'TECHNICIAN');
  await assert.rejects(mutate(admin, 'AdminApproveApplication', { id }));
  await assert.rejects(mutate(admin, 'AdminRejectApplication', { id, note: 'Too late to reject.' }));
  assert.equal((await query(alice, 'GetMyApplication')).technicianApplications[0].status, 'APPROVED');
});

test('review feedback is required and rejected applications cannot be approved', async () => {
  const result = await mutate(bob, 'SubmitMyApplication', { ...application, fullName: 'Bob Technician' });
  const id = result.technicianApplication_insert.id;
  await assert.rejects(mutate(admin, 'AdminRequestApplicationInformation', { id, note: '' }));
  await mutate(admin, 'AdminRequestApplicationInformation', { id, note: 'Please clarify your experience.' });
  assert.equal((await query(bob, 'GetMyApplication')).technicianApplications[0].status, 'NEEDS_INFORMATION');
  await mutate(admin, 'AdminRejectApplication', { id, note: 'Experience could not be verified.' });
  await assert.rejects(mutate(admin, 'AdminApproveApplication', { id }));
  assert.equal((await query(bob, 'GetMyProfile')).user.role, 'CLIENT');
});

test('a failure halfway through approval rolls back the status, role, and audit writes', async () => {
  const user = await account('Rollback');
  const result = await mutate(user, 'SubmitMyApplication', { ...application, fullName: 'Rollback Technician' });
  const id = result.technicianApplication_insert.id;
  // Simulate an inconsistent existing profile to force a unique-key failure
  // after the approval status update, inside the same transaction.
  await privileged(`mutation ExistingProfile($uid: String!, $id: UUID!) {
    technicianProfile_insert(data: { userId: $uid, applicationId: $id })
  }`, { uid: user.uid, id });

  await assert.rejects(mutate(admin, 'AdminApproveApplication', { id }));
  const unchanged = (await query(user, 'GetMyApplication')).technicianApplications[0];
  assert.equal(unchanged.status, 'PENDING');
  assert.equal(unchanged.applicationEvents_on_application.length, 1);
  assert.equal((await query(user, 'GetMyProfile')).user.role, 'CLIENT');
});
