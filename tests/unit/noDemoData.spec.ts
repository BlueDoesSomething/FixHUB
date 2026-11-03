import { beforeEach, describe, expect, test, vi } from 'vitest';
import { technicians, newRequests } from '@/data/catalog';
import { technicians as landingTechnicians } from '@/data/landing/technicians';
import { reportRepairs } from '@/data/reports';
import { completedReviewRepairs, REVIEW_STORAGE_KEY } from '@/data/reviews';
import { createReviewsStore } from '@/stores/reviews';
import { useAuth } from '@/stores/auth';

beforeEach(() => { localStorage.clear(); });

describe('no runtime example records', () => {
  test('does not populate directories, reports, requests, or eligible review repairs', () => {
    for (const collection of [technicians, newRequests, landingTechnicians, reportRepairs, completedReviewRepairs]) expect(collection).toEqual([]);
  });

  test('starts with empty reviews rather than a seeded collection', () => {
    expect(createReviewsStore(localStorage).state.reviews).toEqual([]);
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBeNull();
  });

  test('ignores retired browser review records but preserves unrelated feedback and stored data', () => {
    const review = { id: 'review-actual', repairId: 'repair-actual', customerId: 'user@example.com', customerName: 'Customer', technicianId: 1, device: 'Phone', rating: 5, comment: '', createdAt: '2026-11-01T00:00:00Z' };
    const raw = JSON.stringify([review, { ...review, id: 'sample-review-1', repairId: 'sample-job' }]);
    localStorage.setItem(REVIEW_STORAGE_KEY, raw);
    expect(createReviewsStore(localStorage).state.reviews).toEqual([review]);
    expect(localStorage.getItem(REVIEW_STORAGE_KEY)).toBe(raw);
  });

  test('ignores retired application records without deleting real applications', async () => {
    vi.resetModules();
    const records = [{ id: 'app-demo-1001' }, { id: 'app-user-submitted' }];
    const raw = JSON.stringify(records);
    localStorage.setItem('fixhub.technicianApplications.v1', raw);
    const { useTechnicianApplications } = await import('@/stores/technicianApplications');
    expect(useTechnicianApplications().all()).toEqual([records[1]]);
    expect(localStorage.getItem('fixhub.technicianApplications.v1')).toBe(raw);
  });

  test('has no offline authentication fallback or role-switching API', async () => {
    const auth = useAuth();
    expect(auth).not.toHaveProperty('login');
    expect(auth).not.toHaveProperty('switchRole');
    expect(auth.profile().email).toBe('');
    await expect(auth.loginWithEmail('admin@fixhub.com', 'anything')).rejects.toThrow('Configure');
    expect(auth.state.isAuthenticated).toBe(false);
  });
});
