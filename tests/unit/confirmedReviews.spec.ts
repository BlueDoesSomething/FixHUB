import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createReviewsStore } from '@/stores/reviews';
import { REVIEW_STORAGE_KEY, type RepairReview, type ReviewRepair } from '@/data/reviews';
import { signInTestUser, signOutTestUser } from './fixtures/accounts';

const backend = vi.hoisted(() => ({
  fetchRemoteReviews: vi.fn(), fetchRemoteReviewableRepairs: vi.fn(), fetchMyTechnicianProfileId: vi.fn(),
  publishRemoteReview: vi.fn(), publishRemoteReply: vi.fn(),
}));
vi.mock('@/services/reviewsSync', () => backend);
vi.mock('@/services/supabase', () => ({ isSupabaseConfigured: () => true }));

const repair: ReviewRepair = {
  id: '11111111-1111-4111-8111-111111111111', customerId: 'alex.rivera@email.com', customerName: 'Alex Rivera',
  technicianId: '22222222-2222-4222-8222-222222222222', technicianProfileId: '22222222-2222-4222-8222-222222222222',
  technicianName: 'Test Technician', device: 'Samsung Galaxy', problem: 'Screen fixed', date: '2026-11-10', completed: true,
};

const review: RepairReview = {
  id: '33333333-3333-4333-8333-333333333333', repairId: repair.id, customerId: 'test-client', customerName: 'Alex Rivera',
  technicianId: repair.technicianId, technicianName: repair.technicianName, device: repair.device,
  rating: 5, comment: 'Great repair', createdAt: '2026-11-10T12:00:00.000Z', synced: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  signInTestUser('client');
  backend.fetchRemoteReviews.mockResolvedValue([]);
  backend.fetchRemoteReviewableRepairs.mockResolvedValue([repair]);
  backend.fetchMyTechnicianProfileId.mockResolvedValue(repair.technicianProfileId);
  backend.publishRemoteReview.mockResolvedValue(review.id);
  backend.publishRemoteReply.mockResolvedValue(true);
});
afterEach(() => { signOutTestUser(); });

describe('server-confirmed reviews', () => {
  test('ignores device-only reviews but shows completed repairs from FIXHUB', async () => {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify([{ ...review, id: 'old', repairId: 'different-repair', synced: false }]));
    const store = createReviewsStore(null, true);
    await store.refresh();
    expect(store.mine()).toEqual([]);
    expect(store.pendingRepairs()).toEqual([repair]);
  });

  test('does not claim success or erase review input when FIXHUB rejects the post', async () => {
    const store = createReviewsStore(null, true);
    await store.refresh();
    backend.publishRemoteReview.mockResolvedValueOnce(null);
    await expect(store.submitReviewConfirmed(repair.id, 5, 'Great repair')).rejects.toThrow('could not be sent');
    expect(store.mine()).toEqual([]);
    expect(store.pendingRepairs()).toHaveLength(1);
    const confirmed = await store.submitReviewConfirmed(repair.id, 5, 'Great repair');
    expect(confirmed.id).toBe(review.id);
    expect(confirmed.synced).toBe(true);
    expect(store.mine()).toHaveLength(1);
    expect(store.pendingRepairs()).toEqual([]);
  });

  test('does not show a technician reply until FIXHUB confirms it; published replies cannot be edited', async () => {
    signInTestUser('technician');
    backend.fetchRemoteReviews.mockResolvedValue([review]);
    const store = createReviewsStore(null, true);
    await store.refresh();
    backend.publishRemoteReply.mockResolvedValueOnce(false);
    await expect(store.saveReplyConfirmed(review.id, 'Thank you')).rejects.toThrow('could not be sent');
    expect(store.state.reviews[0].reply).toBeUndefined();
    await store.saveReplyConfirmed(review.id, 'Thank you');
    expect(store.state.reviews[0].reply?.comment).toBe('Thank you');
    await expect(store.saveReplyConfirmed(review.id, 'Edited')).rejects.toThrow('one reply');
  });

  test('migrates an older review only after PayMongo-independent FIXHUB confirmation', async () => {
    const local = { ...review, id: 'review-old', customerId: 'alex.rivera@email.com', synced: undefined };
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify([local]));
    backend.fetchRemoteReviews.mockResolvedValueOnce([]).mockResolvedValueOnce([review]);
    backend.fetchRemoteReviewableRepairs.mockResolvedValueOnce([repair]).mockResolvedValueOnce([]);
    const store = createReviewsStore(null, true);
    await store.refresh();
    expect(backend.publishRemoteReview).toHaveBeenCalledWith(expect.objectContaining({ repairId: repair.id, customerId: 'test-client' }));
    expect(store.mine()).toEqual([review]);
  });

  test('clears reviews on account switch and ignores an earlier account’s delayed response', async () => {
    let finish!: (reviews: RepairReview[]) => void;
    backend.fetchRemoteReviews.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const store = createReviewsStore(null, true);
    const oldRefresh = store.refresh();
    signInTestUser('technician');
    backend.fetchRemoteReviews.mockResolvedValueOnce([]);
    const newRefresh = store.refresh();
    await newRefresh;
    finish([review]);
    await oldRefresh;
    expect(store.state.reviews).toEqual([]);
    expect(store.state.remoteRepairs).toEqual([]);
  });

  test('does not show a review posted during an account change under the new account', async () => {
    const store = createReviewsStore(null, true);
    await store.refresh();
    let finish!: (id: string) => void;
    backend.publishRemoteReview.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const posting = store.submitReviewConfirmed(repair.id, 5, 'Great repair');
    signInTestUser('technician');
    finish(review.id);
    await expect(posting).rejects.toThrow('account changed');
    expect(store.state.reviews).toEqual([]);
  });
});
