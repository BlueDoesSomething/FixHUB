import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createReviewsStore } from '@/stores/reviews';
import { useAuth } from '@/stores/auth';
import { MAX_REVIEW_LENGTH, REVIEW_STORAGE_KEY, summarizeReviews } from '@/data/reviews';
import { seedReviews } from './fixtures/reviews';
import { signInTestUser, signOutTestUser } from './fixtures/accounts';

vi.mock('@/data/catalog', async importOriginal => ({
  ...await importOriginal<typeof import('@/data/catalog')>(), technicians: (await import('./fixtures/reviews')).technicians,
}));
vi.mock('@/data/reviews', async importOriginal => ({
  ...await importOriginal<typeof import('@/data/reviews')>(), completedReviewRepairs: (await import('./fixtures/reviews')).completedReviewRepairs,
}));

const auth = { ...useAuth(), login: signInTestUser, logout: signOutTestUser };
beforeEach(() => { localStorage.clear(); localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(seedReviews())); auth.login('client'); });
afterEach(() => { auth.logout(); vi.restoreAllMocks(); });

describe('browser-local repair reviews', () => {
  test('only offers supplied completed repairs belonging to the customer', () => {
    const store = createReviewsStore(localStorage);
    expect(store.pendingRepairs().map(repair => repair.id)).toEqual(['repair-2', 'repair-3', 'repair-4', 'repair-5']);
    auth.login('technician');
    expect(store.pendingRepairs()).toEqual([]);
  });

  test('persists a review, removes its pending job, and recalculates technician ratings', () => {
    const store = createReviewsStore(localStorage);
    const review = store.submitReview('repair-4', 2, '  Helpful service.  ');
    expect(review.comment).toBe('Helpful service.');
    expect(review.customerName).toBe('Alex Rivera');
    expect(review.technicianId).toBe(1);
    expect(store.mine()).toEqual([review]);
    expect(store.pendingRepairs()).toHaveLength(3);
    expect(store.summary(1)).toMatchObject({ average: 4, total: 4 });
    expect(store.summary(1).distribution.find(row => row.rating === 2)?.count).toBe(1);
    expect(createReviewsStore(localStorage).mine()).toEqual([review]);
  });

  test('accepts a stars-only review and prevents duplicate submissions', () => {
    const store = createReviewsStore(localStorage);
    expect(store.submitReview('repair-4', 5, '').comment).toBe('');
    expect(() => store.submitReview('repair-4', 3, 'Another review')).toThrow('already reviewed');
    expect(store.mine()).toHaveLength(1);
  });

  test.each(['repair-1', 'unknown', 'an-actual-pending-request'])('rejects incomplete or unknown job %s', repairId => {
    expect(() => createReviewsStore(localStorage).submitReview(repairId, 5, '')).toThrow('completed repairs');
    expect(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!)).toEqual(seedReviews());
  });

  test.each([0, 6, 3.5, NaN, Infinity])('rejects invalid rating %s', rating => {
    expect(() => createReviewsStore(localStorage).submitReview('repair-4', rating, '')).toThrow('1 to 5 stars');
  });

  test('rejects overlong feedback without storing it', () => {
    expect(() => createReviewsStore(localStorage).submitReview('repair-4', 5, 'x'.repeat(MAX_REVIEW_LENGTH + 1))).toThrow('1000');
    expect(JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY)!)).toEqual(seedReviews());
  });

  test('requires an authenticated customer for review submission', () => {
    const store = createReviewsStore(localStorage);
    auth.logout();
    expect(() => store.submitReview('repair-4', 5, '')).toThrow('Sign in as a customer');
    auth.login('technician');
    expect(() => store.submitReview('repair-4', 5, '')).toThrow('Sign in as a customer');
    auth.login('admin');
    expect(() => store.submitReview('repair-4', 5, '')).toThrow('Sign in as a customer');
  });

  test('allows only the receiving technician to add and edit a response', () => {
    const store = createReviewsStore(localStorage);
    const original = store.state.reviews[0];
    expect(() => store.saveReply(original.id, 'Thank you')).toThrow('Only the technician');
    auth.login('technician');
    expect(() => store.saveReply('test-review-4', 'Not my review')).toThrow('Only the technician');
    expect(() => store.saveReply('missing', 'Not a review')).toThrow('Only the technician');
    store.saveReply(original.id, '  Thank you!  ');
    store.saveReply(original.id, 'Thanks for choosing FIXHUB!');
    const updated = createReviewsStore(localStorage).state.reviews.find(review => review.id === original.id)!;
    expect(updated.reply?.comment).toBe('Thanks for choosing FIXHUB!');
    expect(updated.rating).toBe(original.rating);
    expect(updated.comment).toBe(original.comment);
    expect(updated.createdAt).toBe(original.createdAt);
    auth.logout();
    expect(() => store.saveReply(original.id, 'Signed out')).toThrow('Only the technician');
  });

  test.each(['', '   ', 'x'.repeat(MAX_REVIEW_LENGTH + 1)])('validates technician reply length', reply => {
    auth.login('technician');
    expect(() => createReviewsStore(localStorage).saveReply('test-review-1', reply)).toThrow('1–1000');
  });

  test('does not update review state if persistence fails', () => {
    const storage = { getItem: () => JSON.stringify(seedReviews()), setItem: vi.fn(() => { throw new Error('Quota exceeded'); }) };
    const store = createReviewsStore(storage);
    expect(() => store.submitReview('repair-4', 5, 'Keep my draft')).toThrow('not been published');
    expect(store.mine()).toEqual([]);
    expect(store.pendingRepairs()).toHaveLength(4);
    auth.login('technician');
    expect(() => store.saveReply('test-review-1', 'Keep my response')).toThrow('not been published');
    expect(store.state.reviews[0].reply).toBeUndefined();
  });

  test('handles unavailable storage without claiming a saved review', () => {
    const store = createReviewsStore(null);
    expect(store.state.reviews).toHaveLength(0);
    expect(() => store.submitReview('repair-4', 5, '')).toThrow('Allow browser storage');
  });

  test.each(['not-json', '{}', '[{"rating":100}]', JSON.stringify([...seedReviews(), seedReviews()[0]])])('preserves unreadable saved data', raw => {
    localStorage.setItem(REVIEW_STORAGE_KEY, raw);
    const store = createReviewsStore(localStorage);
    expect(store.state.storageError).toContain('could not be read');
    expect(store.state.reviews).toHaveLength(0);
    expect(() => store.submitReview('repair-4', 5, '')).toThrow('No saved data has been replaced');
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe(raw);
  });

  test('handles a blocked read and provides a useful warning', () => {
    const store = createReviewsStore({ getItem: () => { throw new Error('Access denied'); }, setItem: vi.fn() });
    expect(store.state.storageError).toContain('browser storage');
  });

  test('does not reintroduce sample reviews when a valid empty collection was saved', () => {
    localStorage.setItem(REVIEW_STORAGE_KEY, '[]');
    const store = createReviewsStore(localStorage);
    expect(store.state.reviews).toEqual([]);
    expect(store.summary(1)).toMatchObject({ average: null, total: 0 });
    expect(summarizeReviews([]).distribution.every(row => row.count === 0)).toBe(true);
  });
});
