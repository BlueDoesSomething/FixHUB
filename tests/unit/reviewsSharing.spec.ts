import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createReviewsStore } from '@/stores/reviews';
import { useAuth } from '@/stores/auth';
import { isRepairReview, mergeReviews, REVIEW_STORAGE_KEY, type RepairReview } from '@/data/reviews';
import { signInTestUser, signOutTestUser } from './fixtures/accounts';

const auth = { ...useAuth(), login: signInTestUser, logout: signOutTestUser };
beforeEach(() => { localStorage.clear(); });
afterEach(() => { auth.logout(); });

function sharedReview(overrides: Partial<RepairReview> = {}): RepairReview {
  return {
    id: '6f0a1c2e-1111-4111-8111-111111111111',
    repairId: '9d4c2b10-2222-4222-8222-222222222222',
    customerId: '44444444-4444-4444-8444-444444444444',
    customerName: 'Shared Customer',
    technicianId: '55555555-5555-4555-8555-555555555555',
    technicianName: 'Shared Technician',
    device: 'Samsung Galaxy S23',
    rating: 5,
    comment: 'Charging port replaced.',
    createdAt: '2026-11-04T00:00:00.000Z',
    synced: true,
    ...overrides,
  };
}

describe('shared review records', () => {
  test('accepts a FIXHUB review keyed by uuid and still accepts browser-local records', () => {
    expect(isRepairReview(sharedReview())).toBe(true);
    expect(isRepairReview(sharedReview({ technicianId: 2, technicianName: undefined, customerId: 'user@example.com', synced: undefined }))).toBe(true);
    expect(isRepairReview(sharedReview({ technicianId: '' }))).toBe(false);
    expect(isRepairReview(sharedReview({ technicianId: 3.5 }))).toBe(false);
    expect(isRepairReview(sharedReview({ technicianName: '   ' }))).toBe(false);
    expect(isRepairReview({ ...sharedReview(), synced: 'yes' })).toBe(false);
  });

  test('lets the shared copy win on one repair while keeping a reply that only exists locally', () => {
    const local: RepairReview = { id: 'review-9d4c2b10', repairId: '9d4c2b10-2222-4222-8222-222222222222', customerId: 'user@example.com', customerName: 'Local Customer', technicianId: 1, device: 'Phone', rating: 4, comment: 'Good repair.', createdAt: '2026-11-01T00:00:00.000Z', reply: { comment: 'Thanks!', createdAt: '2026-11-02T00:00:00.000Z' } };
    const merged = mergeReviews([local], [sharedReview()]);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('6f0a1c2e-1111-4111-8111-111111111111');
    expect(merged[0].technicianName).toBe('Shared Technician');
    expect(merged[0].reply?.comment).toBe('Thanks!');
  });

  test('sorts merged reviews newest first and keeps reviews with no shared copy', () => {
    const older = sharedReview({ id: 'older', repairId: 'repair-older', createdAt: '2026-11-01T00:00:00.000Z' });
    const newer = sharedReview({ id: 'newer', repairId: 'repair-newer', createdAt: '2026-11-06T00:00:00.000Z' });
    const browserOnly = sharedReview({ id: 'browser', repairId: 'repair-browser', customerId: 'user@example.com', technicianId: 7, technicianName: undefined, synced: undefined, createdAt: '2026-11-03T00:00:00.000Z' });
    expect(mergeReviews([browserOnly, older], [newer]).map(review => review.id)).toEqual(['newer', 'browser', 'older']);
  });
});

describe('review store sharing', () => {
  test('refresh without a configured backend keeps browser records untouched', async () => {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify([sharedReview({ customerId: 'user@example.com', technicianId: 1, synced: undefined })]));
    const store = createReviewsStore(localStorage);
    await expect(store.refresh()).resolves.toBeUndefined();
    expect(store.state.remoteRepairs).toEqual([]);
    expect(store.state.reviews).toHaveLength(1);
    expect(store.state.myTechnicianProfileId).toBeNull();
  });

  test('shows a shared review written by this account on any device', () => {
    auth.login('client');
    const store = createReviewsStore(localStorage);
    store.state.reviews = [sharedReview({ customerId: 'test-client' })];
    expect(store.mine()).toHaveLength(1);
    store.state.reviews = [sharedReview({ customerId: 'someone-else' })];
    expect(store.mine()).toHaveLength(0);
  });

  test('offers shared completed repairs only to the signed-in customer', () => {
    const store = createReviewsStore(localStorage);
    const repair = {
      id: '9d4c2b10-2222-4222-8222-222222222222',
      customerId: 'alex.rivera@email.com',
      customerName: 'Alex Rivera',
      technicianId: '55555555-5555-4555-8555-555555555555',
      technicianProfileId: '55555555-5555-4555-8555-555555555555',
      technicianName: 'Shared Technician',
      device: 'Samsung Galaxy S23',
      problem: 'Charging port failure.',
      date: '2026-11-04',
      completed: true,
    };
    store.state.remoteRepairs = [repair];
    auth.login('client');
    expect(store.pendingRepairs().map(item => item.id)).toEqual([repair.id]);

    const review = store.submitReview(repair.id, 5, '  Fixed quickly.  ');
    expect(review.comment).toBe('Fixed quickly.');
    expect(review.technicianId).toBe(repair.technicianId);
    expect(review.technicianName).toBe('Shared Technician');
    expect(store.pendingRepairs()).toEqual([]);
    expect(store.mine()).toEqual([review]);

    auth.login('technician');
    expect(store.pendingRepairs()).toEqual([]);
  });

  test('only the technician profile that received a shared review may reply', () => {
    auth.login('technician');
    const store = createReviewsStore(localStorage);
    store.state.reviews = [sharedReview()];
    store.state.myTechnicianProfileId = 'another-profile';
    expect(() => store.saveReply(sharedReview().id, 'Thank you')).toThrow('Only the technician');

    store.state.myTechnicianProfileId = sharedReview().technicianId as string;
    store.saveReply(sharedReview().id, '  Thank you!  ');
    expect(store.state.reviews[0].reply?.comment).toBe('Thank you!');
    expect(store.state.reviews[0].rating).toBe(5);
  });

  test('filters the shared feed by the uuid profile id used by FIXHUB', () => {
    const store = createReviewsStore(localStorage);
    store.state.reviews = [sharedReview(), sharedReview({ id: 'other', repairId: 'other-repair', technicianId: 'another-technician' })];
    expect(store.forTechnician(sharedReview().technicianId)).toHaveLength(1);
    expect(store.summary(sharedReview().technicianId)).toMatchObject({ average: 5, total: 1 });
    expect(store.summary('missing-profile')).toMatchObject({ average: null, total: 0 });
  });
});
